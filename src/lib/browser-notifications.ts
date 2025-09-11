export const sendBrowserNotification = (
  title: string,
  body: string,
  actionUrl?: string
) => {
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });

    if (actionUrl) {
      notification.onclick = () => {
        window.focus();
        window.location.href = actionUrl;
      };
    }
  }
};
