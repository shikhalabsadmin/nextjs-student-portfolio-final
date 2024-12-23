import React from "react";
import { QuestionList } from "@/components/question-management/QuestionList";
import { QuestionForm } from "@/components/question-management/QuestionForm";

const QuestionManagement = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Question Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <QuestionList />
        </div>
        <div>
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Add New Question</h2>
            <QuestionForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionManagement;