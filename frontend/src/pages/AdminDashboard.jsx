import React from 'react';
import TeachersList from '../components/teachers/TeachersList';

const AdminDashboard = () => {
  return (
    <TeachersList apiEndpoint="/admin/teachers" isSuperAdmin={false} />
  );
};

export default AdminDashboard;