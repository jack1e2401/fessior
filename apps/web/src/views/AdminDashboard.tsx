import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Settings,
  FileText,
  FileCode,
  X
} from 'lucide-react';

import { AdminProblemsTab } from '../components/admin/AdminProblemsTab';
import { AdminSubmissionsTab } from '../components/admin/AdminSubmissionsTab';

import type { IProblem, ProblemDifficulty } from '@ocj/contracts';

interface AdminDashboardProps {
  currentSubView: string;
  onViewChange: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentSubView, onViewChange }) => {
  const { user } = useAuth();
  
  // Extract active tab from routing segment (e.g. admin/problems -> problems)
  const requestedTab = currentSubView.split('/')[1];
  const activeTab = requestedTab === 'submissions' ? 'submissions' : 'problems';

  // Lists
  const [problems, setProblems] = useState<IProblem[]>([]);

  // Create form states
  const [probTitle, setProbTitle] = useState('');
  const [probDesc, setProbDesc] = useState('');
  const [probDiff, setProbDiff] = useState<ProblemDifficulty>('EASY');

  const loadData = async () => {
    try {
      if (activeTab === 'problems') {
        const res = await api.getProblems();
        setProblems(Array.isArray(res.data) ? res.data : (res.data.items || []));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') loadData();
  }, [activeTab, user]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-ink border border-charcoal">
        <h3 className="font-display text-2xl font-bold text-vermilion uppercase tracking-wider mb-2">Quyền truy cập bị từ chối</h3>
        <p className="font-body text-stone">Bạn không có quyền quản trị để truy cập trang này.</p>
      </div>
    );
  }

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createProblem({
        title: probTitle,
        description: probDesc,
        difficulty: probDiff,
        timeLimit: 2000,
        memoryLimit: 256,
        starterCodes: { cpp: '// Code cpp', java: '// Code java', python: '# Code python' },
      });
      if (res.success) {
        setProbTitle('');
        setProbDesc('');
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi tạo bài tập');
    }
  };

  const handleDeleteProblem = async (id: string) => {
    if (!window.confirm('Xóa bài tập này?')) return;
    try {
      await api.deleteProblem(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const tabsList = [
    { id: 'problems', label: 'Bài tập & Testcase', icon: FileText },
    { id: 'submissions', label: 'Nộp bài & Chấm bài', icon: FileCode },
  ];

  return (
    <div className="flex flex-col gap-0 w-full h-screen bg-ink">
      {/* Header */}
      <div className="bg-washi border-b border-charcoal p-4 flex items-center gap-4 shrink-0">
        <div className="bg-ink p-3 border border-charcoal">
          <Settings size={28} className="text-vermilion animate-[spin_10s_linear_infinite]" />
        </div>
        <div>
          <h2 className="font-display text-xl lg:text-2xl font-bold text-linen uppercase tracking-wider">Bảng Quản Trị Hệ Thống (Admin Panel)</h2>
        </div>
      </div>

      {/* Layout Wrapper */}
      <div className="flex flex-col lg:flex-row gap-0 flex-1 min-h-0 overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-[280px] bg-ink border-r border-charcoal flex flex-col shrink-0 overflow-y-auto">
          <div className="flex flex-col p-2 gap-1 flex-1">
            {tabsList.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onViewChange(`admin/${tab.id}`)}
                  className={`flex items-center gap-3 px-4 py-3 font-display text-xs font-bold uppercase tracking-wider transition-colors border-l-[3px] ${
                    isActive
                      ? 'border-l-vermilion bg-ink text-vermilion'
                      : 'border-l-transparent text-stone hover:bg-ink/50 hover:text-linen'
                  }`}
                >
                  <TabIcon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-charcoal mt-auto">
            <button
              onClick={() => window.location.href = '/home'}
              className="w-full flex items-center justify-center gap-2 font-display text-xs font-bold uppercase tracking-wider px-4 py-3 border border-vermilion/50 text-vermilion hover:bg-vermilion hover:text-linen transition-colors"
            >
              <X size={16} />
              <span>Thoát Admin</span>
            </button>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 bg-ink p-6 overflow-y-auto relative min-h-[400px]">
          {activeTab === 'problems' && (
            <AdminProblemsTab
              probTitle={probTitle}
              setProbTitle={setProbTitle}
              probDesc={probDesc}
              setProbDesc={setProbDesc}
              probDiff={probDiff}
              setProbDiff={setProbDiff}
              onSubmit={handleCreateProblem}
              problems={problems}
              onDelete={handleDeleteProblem}
            />
          )}

          {activeTab === 'submissions' && <AdminSubmissionsTab />}





        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
