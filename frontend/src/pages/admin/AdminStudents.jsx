import React from 'react';
import StudentsList from '../../components/admin/students/StudentsList';

const AdminStudents = () => {
  return (
    <StudentsList apiEndpoint="/admin/students" />
  );
};

export default AdminStudents;
