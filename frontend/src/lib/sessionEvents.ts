export const SESSION_REPLACED_CODE = 40101;
export const SESSION_REPLACED_EVENT = "auth:session-replaced";

const SESSION_REPLACED_STORAGE_KEY = "auth-session-replaced-message";
const DEFAULT_MESSAGE = "账号已在其他设备登录，当前会话已退出";

export interface SessionReplacedEventDetail {
  message: string;
}

export function notifySessionReplaced(message = DEFAULT_MESSAGE) {
  const normalizedMessage = message.trim() || DEFAULT_MESSAGE;
  try {
    sessionStorage.setItem(SESSION_REPLACED_STORAGE_KEY, normalizedMessage);
  } catch {
    // 浏览器禁用会话存储时仍通过当前页面事件展示提示。
  }
  window.dispatchEvent(
    new CustomEvent<SessionReplacedEventDetail>(SESSION_REPLACED_EVENT, {
      detail: { message: normalizedMessage },
    }),
  );
}

export function getPendingSessionReplacedMessage() {
  try {
    return sessionStorage.getItem(SESSION_REPLACED_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearPendingSessionReplacedMessage() {
  try {
    sessionStorage.removeItem(SESSION_REPLACED_STORAGE_KEY);
  } catch {
    // 忽略不可用的会话存储。
  }
}
