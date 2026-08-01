import { useRouter } from "vue-router";
import { storeUser } from "../store/users.js"
import jwt_decode from "jwt-decode";

const checkAuth = () => {
  const userStore = storeUser();
  const token = userStore.token;

  if (userStore.dateLogin == "" || userStore.dateLogin == undefined)
    return false;
  const dateLogin = userStore.dateLogin.split("T")[0];
  const dateNow = new Date().toISOString().split("T")[0];

  if (dateLogin !== dateNow || !token) return false;
  return true;
};

const auth = (to, from, next) => {
  if (checkAuth()) {
    const userStore = storeUser();
    const userRole = userStore.getRole();

    if (!to.meta.rol.includes(userRole)) {
      userStore.logoutUser();
      return next({ name: "login" });
    }

    next();
  } else {
    next({ name: "login" });
  }
};

let router = useRouter();
export const routes = [
  /*   {
    path: "/",
    name: "login",
    component: () => import("../views/Mantenimiento.vue"),
  }, */

  {
    path: "/",
    name: "login",
    component: () => import("../views/Login.vue"),
    beforeEnter: (to, from, next) => {
      if (checkAuth()) {
        next({ name: "home" });
      } else {
        next();
      }
      //location.href = 'https://repforacat.com'
    },
  },
  {
    path: "/home",
    name: "home",
    component: () => import("../views/Home.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR", "EVALUADOR", "NOVEDADES"],
    },
    beforeEnter: auth,
  },
  {
    path: "/home/instructor",
    name: "homeInstructor",
    component: () => import("../views/HomeInstructors.vue"),
    meta: {
      rol: ["USER", "PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/complementarias",
    name: "complementarias",
    component: () => import("../views/LoginComplementarias.vue"),
    meta: {
      rol: ["USER", "PROGRAMADOR", "COORDINADOR", "ADMIN"],
    },
    beforeEnter: auth,
  },
  {
    path: "/instructors",
    name: "instructors",
    component: () => import("../views/Instructors.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/competences",
    name: "competences",
    component: () => import("../views/Competences.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/environments",
    name: "environments",
    component: () => import("../views/Environments.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/files",
    name: "files",
    component: () => import("../views/Files.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/programs",
    name: "programs",
    component: () => import("../views/Programs.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/results",
    name: "results",
    component: () => import("../views/Results.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/schedules",
    name: "schedules",
    component: () => import("../views/Schedules.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/editSchedule/:id",
    name: "editSchedule",
    component: () => import("../views/NewSchedule.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/newSchedule",
    name: "newSchedule",
    component: () => import("../views/NewSchedule.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/homeSchedules",
    name: "homeSchedules",
    component: () => import("../views/HomeSchedules.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/reports",
    name: "reports",
    component: () => import("../views/Reports.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/programacion/:token",
    name: "progrmacion",
    component: () => import("../views/Programming.vue"),
  },
  {
    path: "/consultor",
    name: "consultor",
    component: () => import("../views/Reports.vue"),
    meta: {
      rol: ["USER"],
    },
    beforeEnter: auth,
  },
  {
    path: "/tipoConsulta/:opcion",
    name: "tipoConsulta",
    component: () => import("../views/Consult.vue"),
    meta: {
      rol: ["USER", "PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/reportehours",
    name: "reportehours",
    component: () => import("../views/ReporteHoursIntructor.vue"),
    meta: {
      rol: ["USER", "PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/otherSchedule",
    name: "otherSchedule",
    component: () => import("../views/OtherSchedule.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/newOtherSchedule",
    name: "newOtherSchedule",
    component: () => import("../views/NewOtherSchedule.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/editOtherSchedule/:id",
    name: "editOtherSchedule",
    component: () => import("../views/NewOtherSchedule.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/bulkload",
    name: "bulkload",
    component: () => import("../views/Bulkload.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/judgment",
    name: "Judgment",
    component: () => import("../views/Judgment.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR", "EVALUADOR", "NOVEDADES"],
    },
    beforeEnter: auth,
  },
  {
    path: "/news",
    name: "News",
    component: () => import("../views/News.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR", "NOVEDADES"],
    },
    beforeEnter: auth,
  },
  {
    path: "/news/reports",
    name: "ReportsNews",
    component: () => import("../components/News/reportNew.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR", "NOVEDADES"],
    },
    beforeEnter: auth,
  },
  {
    path: "/new/instructor",
    name: "newByInstructor",
    component: () => import("../views/NewByInstructor.vue"),
    meta: {
      rol: ["USER", "PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/users",
    name: "users",
    component: () => import("../views/Users.vue"),
    meta: {
      rol: ["COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/coordination",
    name: "coordination",
    component: () => import("../views/Coordination.vue"),
    meta: {
      rol: ["COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/binnacle",
    name: "binnacle",
    component: () => import("../views/Binnacle.vue"),
    meta: {
      rol: ["COORDINADOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/audit",
    name: "audit",
    component: () => import("../views/Auditcopy.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },

  {
    path: "/forgotPassword",
    name: "forgotPassword",
    component: () => import("../views/ForgotPassword.vue"),
  },
  {
    path: "/resetpassword/:token",
    name: "resetpassword",
    component: () => import("../views/ResetPassword.vue"),
  },
  {
    path: "/test",
    name: "test",
    component: () => import("../views/test.vue"),
  },
  {
    path: "/registernew/form",
    name: "registernew",
    component: () => import("../views/RegisterNew.vue"),
  },
  {
    path: "/extract",
    name: "extract",
    component: () => import("../views/ExtractView.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR", "USER", "INSTRUCTOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/planning",
    name: "planning",
    component: () => import("../views/PlanningView.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR", "USER", "INSTRUCTOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/scheduler",
    name: "scheduler",
    component: () => import("../views/SchedulerView.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR"],
    },
    beforeEnter: auth,
  },

  {
    path: "/home/complementarias",
    name: "homeComplementarias",
    component: () => import("../views/HomeComplementarias.vue"),
    meta: { rol: ["USER", "INSTRUCTOR"] },
    beforeEnter: auth,
  },
  {
    path: "/planning-dashboard",
    name: "planning-dashboard",
    component: () => import("../views/PlanningDashboard.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR", "USER", "ADMIN", "INSTRUCTOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/planning-schedules",
    name: "planning-schedules",
    component: () => import("../views/PlanningSchedules.vue"),
    meta: {
      rol: ["PROGRAMADOR", "COORDINADOR", "USER", "ADMIN", "INSTRUCTOR"],
    },
    beforeEnter: auth,
  },
  {
    path: "/:catchAll(.*)",
    redirect: "/",
  },
];
