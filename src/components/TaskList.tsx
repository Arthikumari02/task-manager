import React, { useState } from 'react';

interface Task {
  id: string;
  name: string;
}

interface TaskListProps {
  title: string;
}

const TaskList: React.FC<TaskListProps> = ({ title }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [taskName, setTaskName] = useState("");

  const handleCreateTask = () => {
    if (taskName.trim() === "") return;
    const newTask = { id: Date.now().toString(), name: taskName };
    setTasks([...tasks, newTask]);
    setTaskName("");
    setIsAdding(false);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-md w-64">
      <h3 className="font-bold mb-3">{title}</h3>

      {/* Tasks */}
      <div className="space-y-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-gray-100 p-2 rounded shadow-sm"
          >
            {task.name}
          </div>
        ))}
      </div>

      {/* Add Task */}
      {isAdding ? (
        <div className="mt-3">
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Enter task name"
            className="w-full border rounded px-2 py-1"
          />
          <div className="flex justify-end mt-2 space-x-2">
            <button
              onClick={() => setIsAdding(false)}
              className="text-gray-600 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTask}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
            >
              Create Task
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="text-blue-600 text-sm mt-3"
        >
          + Add Task
        </button>
      )}
    </div>
  );
};

export default TaskList;
