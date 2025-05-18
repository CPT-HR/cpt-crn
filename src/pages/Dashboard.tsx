
import React from 'react';
import WorkOrderForm from '@/components/WorkOrderForm';

const Dashboard: React.FC = () => {
  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Novi radni nalog</h1>
      <WorkOrderForm />
    </div>
  );
};

export default Dashboard;
