import api from './api';

export const uploadCourseCsv = async (formData) => {
  try {
    const response = await api.post('/hub-courses/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || error.response.data.message || 'Upload failed');
    }
    throw new Error('An unexpected error occurred during upload.');
  }
};

export const fetchDepartmentCourses = async () => {
  try {
    const response = await api.get('/hub-courses');
    return response.data.courses;
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    throw new Error('Could not load courses at this time.');
  }
};

export const fetchModuleContent = async (moduleId) => {
  try {
    const response = await api.get(`/hub-courses/module/${moduleId}`);
    return response.data.module;
  } catch (error) {
    console.error('Failed to fetch module:', error);
    throw new Error('Could not load module contents.');
  }
};

export const fetchAllCourses = async () => {
  const response = await api.get('/hub-courses/admin/all');
  return response.data.courses;
};

export const assignCourse = async (courseId) => {
  const response = await api.post('/hub-courses/admin/assign', { courseId });
  return response.data;
};

export const createNewCourse = async (title, description) => {
  const response = await api.post('/hub-courses/admin/create-course', { title, description });
  return response.data;
};

export const createNewModule = async (courseId, title) => {
  const response = await api.post('/hub-courses/admin/create-module', { courseId, title });
  return response.data;
};

export const deleteCourse = async (courseId) => {
  const response = await api.delete(`/hub-courses/admin/course/${courseId}`);
  return response.data;
};

