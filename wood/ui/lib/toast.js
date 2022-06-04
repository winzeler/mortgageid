const main = require('#ui/main');
const { toast: toastConfig } = require('#config/ui');

function successToast(message, title = 'Success', ...opts) {
  main.default.config.globalProperties.$toast.add({
    severity: 'success',
    summary: title,
    detail: opts.detail || message,
    group: opts.group || 'default',
    life: opts.life || toastConfig.duration,
    ...opts,
  });
}

function infoToast(message, title = 'Info', ...opts) {
  main.default.config.globalProperties.$toast.add({
    severity: 'info',
    summary: title,
    detail: opts.detail || message,
    group: opts.group || 'default',
    life: opts.life || toastConfig.duration,
    ...opts,
  });
}

function warningToast(message, title = 'Warning', ...opts) {
  main.default.config.globalProperties.$toast.add({
    severity: 'warn',
    summary: title,
    detail: opts.detail || message,
    group: opts.group || 'default',
    life: opts.life || toastConfig.duration,
    ...opts,
  });
}

function errorToast(message, title = 'Error', ...opts) {
  main.default.config.globalProperties.$toast.add({
    severity: 'error',
    summary: title,
    detail: opts.detail || message,
    group: opts.group || 'default',
    life: opts.life || toastConfig.duration,
    ...opts,
  });
}

function clearToastGroup(group) {
  main.default.config.globalProperties.$toast.removeGroup(group);
}

function clearAllToasts() {
  main.default.config.globalProperties.$toast.removeAllGroups();
}

module.exports = {
  successToast,
  infoToast,
  warningToast,
  errorToast,
  clearToastGroup,
  clearAllToasts,
};
