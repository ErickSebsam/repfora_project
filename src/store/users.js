import { defineStore } from "pinia";
import jwt_decode from "jwt-decode";
import { ref } from "vue";
import { requestAxios } from "../common/axios";
import { notifyErrorRequest, notifySuccessRequest } from "../common/notify";
export const storeUser = defineStore(
  "storeUser",
  () => {
    let token = ref("");
    let dateLogin = ref();
    let email = ref("");
    let newConsult = ref("");
    let instructorData = ref({});

    const loginUser = async (credentials) => {
      try {
        const { data } = await requestAxios.post("/users/login", credentials);
        token.value = data.token;
        
        console.log(data);
        dateLogin.value = new Date().toISOString();
        email.value = data.email;
        notifySuccessRequest("Logeado con Ã©xito");
        return true;
      } catch (error) {
        notifyErrorRequest(error.response?.data?.msg || error.message || "Error al iniciar sesión");
        return false;
      }
    };

    const getRole = () => {
      if (token.value) {
        const decoded = jwt_decode(token.value);
        return decoded.rol;
      }
      return "USER";
    };

    const getSuper = () => {
      if (token.value) {
        const decoded = jwt_decode(token.value);
        return decoded.super;
      }
      return 0;
    };

    const allUsers = async () => {
      try {
        const { data } = await requestAxios.get("/users", {
          headers: {
            token: token.value,
          },
        });

        return data;
      } catch (error) {
        notifyErrorRequest(error.response?.data?.msg || error.message || "Error al iniciar sesión");
        return false;
      }
    };

    const allUsersCoordinator = async () => {
      try {
        const { data } = await requestAxios.get("/users/onlycoordinator", {
          headers: {
            token: token.value,
          },
        });
        return data;
      } catch (error) {
        notifyErrorRequest(error.response?.data?.msg || error.message || "Error al iniciar sesión");
        return false;
      }
    };

    const allUsersProgrammers = async () => {
      try {
        const { data } = await requestAxios.get("/users/onlyprogrammers", {
          headers: {
            token: token.value,
          },
        });
        return data;
      } catch (error) {
        notifyErrorRequest(error.response?.data?.msg || error.message || "Error al iniciar sesión");
        return false;
      }
    };

    const registerUser = async (info) => {
      try {
        let data = await requestAxios.post("/users/register", info, {
          headers: {
            token: token.value,
          },
        });
        notifySuccessRequest("Usuario registrado correctamente");
        return data;
      } catch (error) {
        notifyErrorRequest(error.response.data.errors.join(", "));
      }
    };

    const updateUser = async (id, info) => {
      try {
        let data = await requestAxios.put(`/users/update/${id}`, info, {
          headers: {
            token: token.value,
          },
        });
        notifySuccessRequest("Usuario actualizado correctamente");
        return data;
      } catch (error) {
        notifyErrorRequest(error.response.data.errors.join(", "));
      }
    };

    const inactiveUser = async (id) => {
      try {
        await requestAxios.put(`/users/inactive/${id}`, null, {
          headers: {
            token: token.value,
          },
        });
        notifySuccessRequest("Usuario desactivado correctamente");
      } catch (error) {
        notifyErrorRequest(error.response.data.errors.join(", "));
      }
    };

    const activeUser = async (id) => {
      try {
        await requestAxios.put(`/users/active/${id}`, null, {
          headers: {
            token: token.value,
          },
        });
        notifySuccessRequest("Usuario activado correctamente");
      } catch (error) {
        notifyErrorRequest(error.response.data.errors.join(", "));
      }
    };

    const sendEmail = async (info) => {
      try {
        await requestAxios.post("/users/resetpassword", info, {
          headers: {
            token: token.value,
          },
        });
        notifySuccessRequest("Correo enviado correctamente");
      } catch (error) {
        console.log(error.response);
        notifyErrorRequest(error.response.data.errors==undefined?error.response.data.msg:error.response.data.errors[0]);
      }
    };

    const sendPassword = async (info, token) => {
      try {
        const res = await requestAxios.put(
          `/users/changepassword/${token}`,
          info
        );
        notifySuccessRequest("ContraseÃ±a cambiada correctamente");
        return res;
      } catch (error) {
        notifyErrorRequest(error.response.data.errors.join(", "));
        return error;
      }
    };

    const logoutUser = () => {
      token.value = "";
      dateLogin.value = "";
      email.value = "";
      newConsult.value = "";
      instructorData.value = {};
    };

    return {
      token,
      newConsult,
      loginUser,
      dateLogin,
      logoutUser,
      email,
      instructorData,
      getRole,
      getSuper,
      allUsers,
      allUsersCoordinator,
      allUsersProgrammers,
      updateUser,
      inactiveUser,
      activeUser,
      registerUser,
      sendEmail,
      sendPassword,
    };
  },
  {
    persist: true,
  }
);

