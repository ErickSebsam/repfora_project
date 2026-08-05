import pdfplumber
import json
import requests
import re
import os
import sys
import unicodedata
import traceback

# Configuración de codificación para Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        import codecs
        sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())

# Configuración de log interno
DEBUG_LOG = "extractor_debug.log"
with open(DEBUG_LOG, "w") as f: f.write("--- INICIO DE EXTRACCION ---\n")

def log_debug(msg):
    print(msg)
    with open(DEBUG_LOG, "a", encoding="utf-8") as f:
        f.write(str(msg) + "\n")

def clean_cid_and_spacing(text):
    if not text: return ""
    text = re.sub(r'\(cid:\d+\)', ' ', text)
    text = re.sub(r'\d{2}/\d{2}/\d{2,4}.*?Página \d+ de \d+', '', text, flags=re.IGNORECASE)
    text = re.sub(r'GFPI- F-\d+ v\d+', '', text, flags=re.IGNORECASE)
    text = "".join(c for c in text if c.isprintable() or c in "\n\r\t")
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def normalize_text(text):
    if not text: return ""
    text = clean_cid_and_spacing(text)
    text = unicodedata.normalize('NFD', text)
    text = "".join([c for c in text if unicodedata.category(c) != 'Mn'])
    return text.upper().strip()

def ultra_normalize(text):
    if not text: return ""
    text = normalize_text(text)
    return re.sub(r'[^A-Z0-9]', '', text)

def normalize_date(date_str):
    """ Convierte fechas tipo '10 de Febrero 2025' o '10/02/2025' a ISO (YYYY-MM-DD) para MongoDB """
    if not date_str: return None
    months = {
        'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
        'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
    }
    try:
        d = date_str.lower().replace(' de ', ' ').replace('/', ' ').replace('-', ' ')
        parts = d.split()
        if len(parts) < 3: return None
        day = parts[0].zfill(2)
        month = parts[1]
        year = parts[2]
        if month in months: month = months[month]
        else: month = month.zfill(2)
        if len(year) == 2: year = "20" + year
        return f"{year}-{month}-{day}"
    except: return None

class SenaExtractor:
    def __init__(self, program_pdf, project_pdf, team_pdf=None, fiche="000000"):
        self.program_pdf = program_pdf
        self.project_pdf = project_pdf
        self.team_pdf = team_pdf
        
        provided_fiche = str(fiche).strip()
        self.fiche = None
        
        # 1. Intentar autodetectar el número de ficha real directamente de los PDFs primero
        self._auto_detect_fiche()
        
        # 2. Si la detección falló o dio un valor inválido/placeholder, usar el parámetro provisto por el frontend
        if not self.fiche or self.fiche in ["000000", "", "EXTRACTED", "undefined", "null"] or "EXTRACTED" in self.fiche:
            if provided_fiche and provided_fiche not in ["000000", "", "EXTRACTED", "undefined", "null"] and "EXTRACTED" not in provided_fiche:
                self.fiche = provided_fiche
                log_debug(f"[INIT] Usando Ficha provista (fallback): {self.fiche}")
            else:
                self.fiche = "000000"
                log_debug(f"[INIT] Usando Ficha por defecto: {self.fiche}")
        else:
            log_debug(f"[INIT] Usando Ficha detectada de los PDFs: {self.fiche}")
            
        self.unique_raps_codes = set()
        self.in_activities_table = False
        self.global_rap_registry = set()
        self.data = {"pedagogicalPlanning": {"metadata": {"programName": "", "programCode": "", "totalHours": 0, "lectivaHours": 0, "productivaHours": 0, "teamPdfProcessed": False, "projectCode": ""}, "fiche": self.fiche, "status": "draft", "content": []}}
        
        self.competencies_data = {} 
        self.instructor_map = {}   
        self.temp_content = {}
        self.phase_activities = {}
        self.ap_full_names = {}
        self.current_ap_prefix = None

    def _auto_detect_fiche(self):
        # 1. Intentar detectar en el PDF del Equipo Ejecutor (self.team_pdf)
        if self.team_pdf:
            try:
                log_debug(f"[AUTO-DETECT] Buscando número de ficha en team_pdf: {self.team_pdf}")
                with pdfplumber.open(self.team_pdf) as pdf:
                    for page in pdf.pages[:3]:
                        text = page.extract_text()
                        if text:
                            # Patrones para buscar número de ficha (e.g., Ficha: 2721837, Ficha 2721837, No. de Ficha 2721837, etc.)
                            match = re.search(r'(?:Ficha\s+de\s+caracterizaci[oó]n|Ficha\s+caracterizaci[oó]n|Ficha[s]?|N[uú]mero\s+de\s+ficha|N[o°\.]?\s*de\s*ficha|C[oó]digo\s+(?:de\s+)?(?:la\s+)?ficha)\s*:?\s*(\d{5,9})', text, re.IGNORECASE)
                            if match:
                                self.fiche = match.group(1).strip()
                                log_debug(f"[AUTO-DETECT] Ficha encontrada en team_pdf con patrón: {self.fiche}")
                                return
                            
                            # Fallback: buscar cualquier número de 7 u 8 dígitos que comience con 1, 2, 3 o 4 (rango típico de fichas del SENA)
                            matches = re.findall(r'\b([1-4]\d{6,7})\b', text)
                            if matches:
                                self.fiche = matches[0].strip()
                                log_debug(f"[AUTO-DETECT] Ficha encontrada en team_pdf por secuencia numérica: {self.fiche}")
                                return
            except Exception as e:
                log_debug(f"[AUTO-DETECT] Error leyendo team_pdf: {e}")

        # 2. Fallback al PDF de proyecto (project_pdf)
        try:
            log_debug(f"[AUTO-DETECT] Buscando en project_pdf: {self.project_pdf}")
            with pdfplumber.open(self.project_pdf) as pdf:
                for page in pdf.pages[:3]:
                    text = page.extract_text()
                    if text:
                        match = re.search(r'C[oó]digo\s+Proyecto\s+SOFIA\s*:\s*(\d+)', text, re.IGNORECASE)
                        if match:
                            self.fiche = match.group(1).strip()
                            log_debug(f"[AUTO-DETECT] Ficha encontrada en project_pdf: {self.fiche}")
                            return
        except Exception as e:
            log_debug(f"[AUTO-DETECT] Error leyendo project_pdf: {e}")

    def extract_program_details(self):
        """ PDF 1: DICCIONARIO DE DATOS (REFORZADO) """
        log_debug(f"[STEP 1] Analizando Programa (PDF 1)...")
        try:
            with pdfplumber.open(self.program_pdf) as pdf:
                all_text = ""
                for page in pdf.pages: all_text += (page.extract_text() or "") + "\n---PAGE---\n"
                
                all_text_clean = re.sub(r'\(cid:\d+\)', ' ', all_text)
                
                name_match = re.search(r'Denominaci[oó]n\s*\n?\s*(.*?)\s*\n?\s*del Programa:', all_text_clean, re.IGNORECASE)
                self.data["pedagogicalPlanning"]["metadata"]["programName"] = name_match.group(1).strip() if name_match else self._regex_find(r'Denominaci[oó]n\s*del Programa:\s*(.*)', all_text_clean, "PROGRAMA")
                
                code_match = re.search(r'C[oó]digo\s*\n?\s*(\d+)\s*\n?\s*Programa:', all_text_clean, re.IGNORECASE)
                self.data["pedagogicalPlanning"]["metadata"]["programCode"] = code_match.group(1).strip() if code_match else self._regex_find(r'C[oó]digo\s*Programa:\s*(\d+)', all_text_clean, "000000")
                
                lectiva_match = re.search(r'Etapa\s+Lectiva:\s*(\d+)\s*horas', all_text_clean, re.IGNORECASE)
                if lectiva_match:
                    self.data["pedagogicalPlanning"]["metadata"]["lectivaHours"] = int(lectiva_match.group(1))

                productiva_match = re.search(r'Etapa\s+Productiva:\s*(\d+)\s*horas', all_text_clean, re.IGNORECASE)
                if productiva_match:
                    self.data["pedagogicalPlanning"]["metadata"]["productivaHours"] = int(productiva_match.group(1))

                total_match = re.search(r'T+o+t+a+l+::?\s*(\d+)\s*horas', all_text_clean, re.IGNORECASE)
                if total_match:
                    self.data["pedagogicalPlanning"]["metadata"]["totalHours"] = int(total_match.group(1))
                
                comp_sections = re.split(r'CONTENIDOS\s+CURRICULARES', all_text_clean, flags=re.IGNORECASE)
                for section in comp_sections[1:]:
                    code_match = re.search(r'\b(\d{9})\b', section)
                    if not code_match: continue
                    code = code_match.group(1)
                    
                    # LIMPIEZA AGRESIVA DE NOMBRE
                    name_match = re.search(r'(?:4\.1|COMPETENCIA)\s*(.*?)\s*(?:4\.2|C[OÓ]DIGO|DURACI[OÓ]N)', section, re.IGNORECASE | re.DOTALL)
                    raw_name = name_match.group(1) if name_match else f"{code}"
                    full_name = re.sub(r'^.*?NORMA\s*/\s*UNIDAD\s*DE\s*', '', raw_name, flags=re.IGNORECASE | re.DOTALL)
                    full_name = re.sub(r'^\s*COMPETENCIA\s*', '', full_name, flags=re.IGNORECASE)
                    full_name = re.sub(r'\s*COMPETENCIA\s*$', '', full_name, flags=re.IGNORECASE)
                    full_name = re.sub(r'^\s*4\.1\s*', '', full_name, flags=re.IGNORECASE)
                    full_name = clean_cid_and_spacing(full_name).upper().strip()
                    
                    # EXTRACCIÓN DE DURACIÓN (Numeral 4.4)
                    dur_match = re.search(r'4\.4\s+DURACI[OÓ]N\s+M[AÁ]XIMA.*?(\d+)\s*horas', section, re.IGNORECASE | re.DOTALL)
                    duration = int(dur_match.group(1)) if dur_match else 0
                    
                    self.competencies_data[code] = {"name": full_name, "code": code, "duration": duration, "concepts": [], "processes": [], "criteria": [], "academicRequirements": ""}
                    
                    s_match = re.search(r'CONOCIMIENTOS\s+DEL\s+SABER\s*(.*?)\s*(?:CONOCIMIENTOS\s+DE\s+PROCESO|CRITERIOS|4\.)', section, re.IGNORECASE | re.DOTALL)
                    if s_match: self.competencies_data[code]["concepts"] = self._clean_list(s_match.group(1))
                    p_match = re.search(r'CONOCIMIENTOS\s+DE\s+PROCESO\s*(.*?)\s*(?:CONOCIMIENTOS\s+DEL\s+SABER|CRITERIOS|4\.)', section, re.IGNORECASE | re.DOTALL)
                    if p_match: self.competencies_data[code]["processes"] = self._clean_list(p_match.group(1))
                    c_match = re.search(r'CRITERIOS\s+DE\s+EVALUACI[OÓ]N\s*(.*?)\s*(?:PERFIL|CONTENIDOS|4\.|5\.|6\.)', section, re.IGNORECASE | re.DOTALL)
                    if c_match: self.competencies_data[code]["criteria"] = self._clean_list(c_match.group(1))
                    
                    # Extraer 4.8.1 Requisitos Académicos Mínimos (Perfil del Instructor)
                    req_match = re.search(r'(?:4\.8\.1\s+Requisitos\s+Acad[eé]micos\s+M[ií]nimos|Requisitos\s+Acad[eé]micos)\s*(.*?)\s*(?:4\.8\.2|Experiencia|Perfil|5\.)', section, re.IGNORECASE | re.DOTALL)
                    if req_match:
                        self.competencies_data[code]["academicRequirements"] = clean_cid_and_spacing(req_match.group(1)).upper().strip()
        except Exception as e: log_debug(f"[ERROR PDF 1] {e}")

    def extract_team_details(self):
        if not self.team_pdf: return
        log_debug(f"[STEP 1.5] Analizando Equipo (PDF 3)...")
        try:
            with pdfplumber.open(self.team_pdf) as pdf:
                full_text = ""
                for page in pdf.pages: full_text += (page.extract_text() or "") + "\n"
                
                date_p = r'(\d{1,2}(?:\s+de\s+[a-zA-Z]+|\s*[\/\-]\s*\d{1,2})\s*[\/\-]?\s*\d{2,4})'
                s_match = re.search(r'\b(?:fecha\s+)?inicio\s+etapa\s+lectiva\s+' + date_p, full_text, re.IGNORECASE)
                if s_match: self.data["pedagogicalPlanning"]["metadata"]["lectivaStartDate"] = normalize_date(s_match.group(1))
                e_match = re.search(r'\b(?:fecha\s+)?fin\s+etapa\s+lectiva\s+' + date_p, full_text, re.IGNORECASE)
                if e_match: self.data["pedagogicalPlanning"]["metadata"]["lectivaEndDate"] = normalize_date(e_match.group(1))

                for page in pdf.pages:
                    tables = page.extract_tables()
                    for table in tables:
                        for row in table:
                            if not row or len(row) < 2: continue
                            instructor = clean_cid_and_spacing(str(row[0]))
                            if not instructor or normalize_text(instructor) in ["INSTRUCTOR", "NOMBRE", "COMPETENCIAS"]: continue
                            
                            # Separar competencias por viñetas o saltos
                            c_raw = str(row[1])
                            c_lines = re.split(r'[•●\-\*]|\n', c_raw)
                            for c_line in c_lines:
                                line_clean = clean_cid_and_spacing(c_line)
                                if len(line_clean) < 10: continue
                                
                                code_m = re.search(r'\b(\d{9})\b', line_clean)
                                if code_m:
                                    self.instructor_map[code_m.group(1)] = instructor
                                else:
                                    # Fallback: Coincidencia por palabras clave
                                    words = {w for w in normalize_text(line_clean).split() if len(w) > 3}
                                    if words:
                                        if "keyword_matches" not in self.instructor_map: self.instructor_map["keyword_matches"] = []
                                        self.instructor_map["keyword_matches"].append({"keywords": words, "name": instructor})
            log_debug(f"  [PDF 3] Datos procesados.")
            self.data["pedagogicalPlanning"]["metadata"]["teamPdfProcessed"] = True
        except Exception as e: log_debug(f"[ERROR PDF 3] {e}")

    def _get_suggested_instructor(self, c_code, c_full_name):
        if c_code in self.instructor_map: return self.instructor_map[c_code]
        if "keyword_matches" in self.instructor_map:
            comp_words = {w for w in normalize_text(c_full_name).split() if len(w) > 3}
            best_match, max_overlap = "", 0
            for entry in self.instructor_map["keyword_matches"]:
                overlap = len(comp_words.intersection(entry["keywords"]))
                if overlap > max_overlap:
                    max_overlap = overlap
                    best_match = entry["name"]
            if max_overlap > 0 and (max_overlap / len(comp_words)) >= 0.4: return best_match
        return ""

    def _detect_phase(self, text):
        if not text: return None
        raw = clean_cid_and_spacing(text).upper()
        if len(raw) < 5 or len(raw) > 50: return None
        nl = normalize_text(raw)
        if  "ANALISIS" in nl : return "ANALYSIS"
        if "PLANEACION" in nl: return "PLANNING"
        if  "EJECUCION" in nl: return "EXECUTION"
        if  "EVALUACION" in nl: return "EVALUATION"
        if  "INDUCCION" in nl: return "INDUCCION"
        if "ETAPA" in nl and "PRODUCTIVA" in nl: return "ETAPA_PRODUCTIVA"
        if "ETAPAPRODUCTIVA" in nl : return "ETAPA_PRODUCTIVA"
        return None

    def extract_project_structure(self):
        log_debug(f"[STEP 2] Analizando Proyecto (PDF 2)...")
        current_phase = "ANALYSIS"
        last_comp = None
        try:
            with pdfplumber.open(self.project_pdf) as pdf:
                # Extraer Código Proyecto SOFIA de la primera página
                first_page_text = pdf.pages[0].extract_text() or ""
                p_match = re.search(r'C[oó]digo\s+Proyecto\s+SOFIA:\s*(\d+)', first_page_text, re.IGNORECASE)
                if p_match:
                    self.data["pedagogicalPlanning"]["metadata"]["projectCode"] = p_match.group(1)
                    log_debug(f"  [PDF 2] Código de proyecto SOFIA detectado: {p_match.group(1)}")
                
                for page in pdf.pages:
                    if any(x in (page.extract_text() or "").upper() for x in ["TABLA DE CONTENIDO", "INDICE"]): continue
                    tables = page.extract_tables()
                    for table in tables:
                        for row in table:
                            if not row or len(row) < 2: continue
                            cells = [clean_cid_and_spacing(str(c)) for c in row]
                            comp_match = re.search(r'\b(\d{9})\b', " ".join(cells))
                            if comp_match:
                                self.in_activities_table = True
                                last_comp = comp_match.group(1)
                            for i in [0, 1]:
                                if i < len(cells):
                                    found = self._detect_phase(cells[i])
                                    if found: current_phase = found; break
                            if len(cells) > 1 and cells[1] and self.in_activities_table:
                                text_cell = cells[1].strip().upper()
                                text_cell = re.sub(r'\s+', ' ', text_cell)
                                is_noise = any(k in text_cell for k in [
                                    "SERVICIO NACIONAL DE APRENDIZAJE",
                                    "SISTEMA INTEGRADO DE GESTION",
                                    "SISTEMA INTEGRADO DE GESTIÓN",
                                    "AUTOCONTROL PROCEDIMIENTO",
                                    "EJECUCION DE LA FORMACION",
                                    "EJECUCIÓN DE LA FORMACIÓN",
                                    "PROYECTO FORMATIVO",
                                    "SISTEMA INTEGRADO"
                                ])
                                if is_noise: text_cell = ""
                                if text_cell:
                                    is_new_ap = re.match(r'^AP\s*\d+', text_cell) or re.match(r'^AP\s*\-', text_cell) or text_cell.startswith("ACTIVIDAD")
                                    if is_new_ap or len(text_cell) > 25:
                                        if is_new_ap:
                                            pref_match = re.match(r'^(AP\s*\d+)', text_cell)
                                            if pref_match:
                                                self.current_ap_prefix = pref_match.group(1).replace(" ", "")
                                            else:
                                                self.current_ap_prefix = None
                                                
                                            existing_ap = self.phase_activities.get(current_phase, "")
                                            if existing_ap.startswith(text_cell) or text_cell in existing_ap:
                                                pass
                                            else:
                                                self.phase_activities[current_phase] = text_cell
                                                if self.current_ap_prefix:
                                                    self.ap_full_names[self.current_ap_prefix] = text_cell
                                        elif current_phase in self.phase_activities:
                                            if text_cell not in self.phase_activities[current_phase]:
                                                joined = (self.phase_activities[current_phase] + " " + text_cell).strip()
                                                joined = joined.replace("ESTRUC ADMINISTRATIVA", "ESTRUCTURA ADMINISTRATIVA")
                                                self.phase_activities[current_phase] = joined
                                                if self.current_ap_prefix:
                                                    self.ap_full_names[self.current_ap_prefix] = joined
                                        else:
                                            self.phase_activities[current_phase] = text_cell
                                            if self.current_ap_prefix:
                                                self.ap_full_names[self.current_ap_prefix] = text_cell
                            comp_match = re.search(r'\b(\d{9})\b', " ".join(cells))
                            if comp_match: last_comp = comp_match.group(1)
                            for i in range(1, len(cells)):
                                r_match = re.search(r'\b(\d{6,7})\b', cells[i])
                                if r_match and last_comp:
                                    r_code = r_match.group(1)
                                    if r_code in self.global_rap_registry: continue
                                    r_desc = re.sub(r'^[\s\-–—:]+', '', cells[i].replace(r_code, "")).strip().upper()
                                    if len(r_desc) > 10:
                                        target_phase = "ETAPA_PRODUCTIVA" if last_comp == "999999999" else current_phase
                                        if target_phase == "ETAPA_PRODUCTIVA":
                                            self.phase_activities["ETAPA_PRODUCTIVA"] = cells[1].strip().upper() if len(cells) > 1 else "ETAPA PRODUCTIVA"
                                        project_act = self.phase_activities.get(target_phase, "")
                                        self._integrate(target_phase, last_comp, r_desc, r_code, project_act)
                                        self.global_rap_registry.add(r_code)
                                        self.unique_raps_codes.add(r_code)
                                        break
            # Post-procesar para aplicar el nombre de la Actividad de Proyecto completo a todos los RAPs
            for phase in self.temp_content:
                for comp in self.temp_content[phase]:
                    for rap in comp.get("learningOutcomes", []):
                        ap_text = rap.get("projectActivity", "")
                        match = re.match(r'^(AP\s*\d+)', ap_text)
                        if match:
                            prefix = match.group(1).replace(" ", "")
                            if prefix in self.ap_full_names:
                                rap["projectActivity"] = self.ap_full_names[prefix]
                                
            self._final_cleanup()
        except Exception as e: log_debug(f"[ERROR PDF 2] {e}"); self._final_cleanup()

    def _integrate(self, phase, c_code, r_desc, r_code, project_activity=""):
        if phase not in self.temp_content: self.temp_content[phase] = []
        c_info = self.competencies_data.get(c_code) or {"name": f"COMPETENCIA {c_code}", "code": c_code, "duration": 0, "concepts": [], "processes": [], "criteria": [], "academicRequirements": ""}
        c_node = next((c for c in self.temp_content[phase] if c["code"] == c_code), None)
        if not c_node:
            instr = self._get_suggested_instructor(c_code, c_info["name"])
            c_node = {
                "name": c_info["name"], "code": c_code, "totalCompetenceHours": c_info.get("duration", 0),
                "knowledge": {"conceptsAndPrinciples": c_info["concepts"], "processes": c_info["processes"]},
                "evaluationCriteria": c_info["criteria"],
                "academicRequirements": c_info.get("academicRequirements", ""),
                "learningOutcomes": [], 
                "suggestedInstructor": {"id": "", "name": instr}
            }
            self.temp_content[phase].append(c_node)
        if not any(r["description"] == r_desc for r in c_node["learningOutcomes"]):
            c_node["learningOutcomes"].append({
                "description": r_desc, "evaluationCriteria": [], 
                "projectActivity": project_activity,
                "pedagogicalActivities": [{
                    "description": "", 
                    "hours": {"direct": 0, "independent": 0}, 
                    "learningEvidences": [], "didacticStrategies": [], 
                    "environment": {"type": "", "materials": []}, "observations": "",
                    "suggestedInstructor": c_node["suggestedInstructor"], 
                    "scheduleDetails": {"assignedDays": [], "shift": "", "hoursPerDay": 0, "calendarNotes": ""}
                }]
            })

    def _final_cleanup(self):
        self.data["pedagogicalPlanning"]["content"] = []
        for p in ["INDUCCION", "ANALYSIS", "PLANNING", "EXECUTION", "EVALUATION", "ETAPA_PRODUCTIVA"]:
            if p in self.temp_content:
                phase_act = self.phase_activities.get(p, "ACTIVIDAD GENERAL DE LA FASE")
                self.data["pedagogicalPlanning"]["content"].append({"phase": p, "projectActivity": phase_act, "competencies": self.temp_content[p]})

    def _regex_find(self, pattern, text, default):
        m = re.search(pattern, text, re.IGNORECASE)
        return clean_cid_and_spacing(m.group(1)) if m else default

    def _clean_list(self, text):
        if not text: return []
        text = clean_cid_and_spacing(text)
        items = re.split(r'\.\s+|\n|(?<=[A-Z])\s*-\s*', text)
        cleaned = []
        for i in items:
            s = re.sub(r'^\d+(\.\d+)*\s*', '', i).strip()
            if len(s) > 2 and "Página" not in s: cleaned.append(s.upper())
        return list(dict.fromkeys(cleaned))

    def align_with_database(self):
        try:
            mongo_url = None
            env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
            if os.path.exists(env_path):
                with open(env_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        if line.strip().startswith('MONGO_URL='):
                            mongo_url = line.strip().split('MONGO_URL=', 1)[1]
                            break
            
            if not mongo_url:
                log_debug("[DB_ALIGN] MONGO_URL no encontrada en el archivo .env")
                return

            from pymongo import MongoClient
            client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
            db = client.get_default_database()
            
            program_code = self.data["pedagogicalPlanning"]["metadata"]["programCode"]
            fiche_number = self.data["pedagogicalPlanning"]["fiche"]
            
            log_debug(f"[DB_ALIGN] Iniciando alineación para Ficha: {fiche_number}, Programa: {program_code}")
            
            # Buscar programa en DB
            program_doc = db.programs.find_one({"code": program_code})
            if not program_doc and fiche_number:
                fiche_doc = db.fiches.find_one({"number": fiche_number})
                if fiche_doc and "program" in fiche_doc:
                    program_doc = db.programs.find_one({"_id": fiche_doc["program"]})
            
            if not program_doc:
                program_name = self.data["pedagogicalPlanning"]["metadata"]["programName"]
                if program_name:
                    program_doc = db.programs.find_one({"name": {"$regex": re.escape(program_name), "$options": "i"}})
            
            if not program_doc:
                log_debug("[DB_ALIGN] No se encontró el programa en la base de datos.")
                client.close()
                return
                
            log_debug(f"[DB_ALIGN] Programa encontrado en DB: {program_doc.get('name')} (ID: {program_doc['_id']})")
            
            # Obtener competencias del programa en DB
            db_competences = list(db.competences.find({"program": program_doc["_id"]}))
            log_debug(f"[DB_ALIGN] Se encontraron {len(db_competences)} competencias en DB.")
            
            # Helper de palabras
            def get_words(text):
                if not text: return set()
                text = unicodedata.normalize('NFD', text)
                text = "".join([c for c in text if unicodedata.category(c) != 'Mn'])
                text = re.sub(r'[^A-Z0-9\s]', ' ', text.upper())
                return set(w for w in text.split() if len(w) > 2)

            # Helper de similitud
            def get_similarity(text1, text2):
                w1 = get_words(text1)
                w2 = get_words(text2)
                if not w1 or not w2: return 0.0
                intersection = w1.intersection(w2)
                return len(intersection) / min(len(w1), len(w2))
                
            # Alinear competencias y resultados
            comp_count = 0
            rap_count = 0
            for phase in self.data["pedagogicalPlanning"].get("content", []):
                for comp in phase.get("competencies", []):
                    parsed_code = comp.get("code")
                    parsed_name = comp.get("name")
                    
                    best_comp = None
                    best_comp_score = 0.0
                    
                    # Intentar buscar coincidencia exacta de código
                    for dbc in db_competences:
                        if str(dbc.get("number")).strip() == str(parsed_code).strip():
                            best_comp = dbc
                            best_comp_score = 1.0
                            break
                            
                    # Fallback por similitud de nombre
                    if not best_comp:
                        for dbc in db_competences:
                            score = get_similarity(parsed_name, dbc.get("name"))
                            if score > best_comp_score:
                                best_comp_score = score
                                best_comp = dbc
                                
                    if best_comp and best_comp_score >= 0.4:
                        new_code = best_comp.get("number")
                        new_name = best_comp.get("name")
                        
                        original_is_official = len(str(parsed_code).strip()) == 9
                        if str(new_code).strip() != str(parsed_code).strip() and original_is_official:
                            comp["name"] = new_name
                            log_debug(f"[DB_ALIGN] Respetando código oficial del PDF: {parsed_code} (Evitando cambiar a {new_code})")
                        else:
                            comp["code"] = new_code
                            comp["name"] = new_name
                        comp_count += 1
                        
                        # Buscar resultados de esta competencia en DB
                        db_outcomes = list(db.outcomes.find({"competence": best_comp["_id"]}))
                        
                        for rap in comp.get("learningOutcomes", []):
                            parsed_desc = rap.get("description")
                            
                            best_outcome = None
                            best_outcome_score = 0.0
                            
                            for dbo in db_outcomes:
                                score = get_similarity(parsed_desc, dbo.get("outcomes"))
                                if score > best_outcome_score:
                                    best_outcome_score = score
                                    best_outcome = dbo
                                    
                            if best_outcome and best_outcome_score >= 0.4:
                                rap["description"] = best_outcome.get("outcomes")
                                rap_count += 1
                                
            client.close()
            log_debug(f"[DB_ALIGN] Alineación finalizada. Competencias alineadas: {comp_count}, RAPs alineados: {rap_count}")
        except Exception as ex:
            log_debug(f"[DB_ALIGN] Error durante la alineación: {ex}")
            traceback.print_exc()

    def output_result(self):
        if self.data["pedagogicalPlanning"]["content"]:
            self.align_with_database()
            print("---JSON_START---")
            print(json.dumps(self.data))
            print("---JSON_END---")
        else:
            sys.stderr.write("No se pudieron extraer fases ni competencias validas de los documentos.\n")
            sys.exit(1)

if __name__ == "__main__":
    args = sys.argv[1:]
    if len(args) < 3: sys.exit(1)
    program, project, team, fiche = args[0], args[1], (args[2] if len(args)==4 else None), (args[3] if len(args)==4 else args[2])
    ext = SenaExtractor(program, project, team, fiche)
    ext.extract_program_details(); ext.extract_team_details(); ext.extract_project_structure(); ext.output_result()
    log_debug(f"[DONE] Total RAPs: {len(ext.unique_raps_codes)}. Ficha: {ext.fiche}")
