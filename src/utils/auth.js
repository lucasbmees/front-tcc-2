export const getToken = () => localStorage.getItem('token');

export const getUsuarioId = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return (
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || 
      payload["nameid"] || 
      payload.sub || 
      payload.id
    );
  } catch {
    return null;
  }
};

export const getRoleFromToken = (token) => {
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role =
      payload.role ||
      payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'] ||
      '';

    if (Array.isArray(role)) return role[0] || '';
    return role || '';
  } catch {
    return '';
  }
};

export const getPlanFromToken = (token) => {
  if (!token) return '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const plan = payload.plan || payload['plan'] || '';
    if (Array.isArray(plan)) return plan[0] || '';
    return plan || '';
  } catch {
    return '';
  }
};
