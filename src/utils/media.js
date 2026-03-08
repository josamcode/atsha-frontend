const API_ORIGIN = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export const getMediaUrl = (pathOrUrl) => {
  if (!pathOrUrl) {
    return '';
  }

  if (
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:') ||
    /^https?:\/\//i.test(pathOrUrl)
  ) {
    return pathOrUrl;
  }

  return `${API_ORIGIN}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
};

export default getMediaUrl;
