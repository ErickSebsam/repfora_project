import { Notify } from "quasar";

export const notifyErrorRequest = (msg, position = "top") => {
  Notify.create({
    color: "negative",
    message: msg,
    icon: "error",
    position: position,
    timeout: 4500,
  });
};

export const notifySuccessRequest = (msg, position = "top") => {
  Notify.create({
    color: "positive",
    message: msg,
    icon: "check",
    position: position,
    timeout: 3500,
  });
};


export const notifyWarningRequest = (msg, position = "top") => {
  Notify.create({
    color: "warning",
    message: msg,
    icon: "warning",
    textColor: "black",
    position: position,
    timeout: 18000,
  });
}

