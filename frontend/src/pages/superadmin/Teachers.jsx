import React from 'react';
import TeachersList from '../../components/teachers/TeachersList';

const Teachers = () => {
  return (
    <TeachersList apiEndpoint="/superadmin/teachers" isSuperAdmin={true} />
  );
};

export default Teachers;
