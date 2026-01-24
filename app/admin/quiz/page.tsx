'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  GripVertical, 
  Plus, 
  Pencil, 
  Trash2, 
  Settings, 
  ListChecks, 
  CheckSquare, 
  CircleDot,
  Loader2,
  FileQuestion
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question_text: string;
  question_type: 'radio' | 'checkbox';
  order_index: number;
  quiz_answer_options: any[];
}

export default function QuizAdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/admin/quiz/questions');
      if (!response.ok) throw new Error('Failed to fetch questions');
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/admin/quiz/questions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete question');
      await fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = questions.findIndex((q) => q.id === draggedId);
    const targetIndex = questions.findIndex((q) => q.id === targetId);

    const newQuestions = [...questions];
    const [draggedQuestion] = newQuestions.splice(draggedIndex, 1);
    newQuestions.splice(targetIndex, 0, draggedQuestion);

    // Update local state immediately for snappy UI
    // Recalculate order_index for UI purposes
    const reorderedList = newQuestions.map((q, index) => ({
        ...q,
        order_index: index
    }));
    
    setQuestions(reorderedList);

    // Update order on server
    const questionIds = reorderedList.map((q) => q.id);
    try {
      const response = await fetch('/api/admin/quiz/questions/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionIds }),
      });
      if (!response.ok) throw new Error('Failed to reorder questions');
    } catch (error) {
      console.error('Error reordering questions:', error);
      await fetchQuestions(); // Revert on error
    }

    setDraggedId(null);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-950">Quiz Management</h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            Manage and reorder your survey questions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/quiz/intro">
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-900">
              <Settings className="mr-2 h-4 w-4" />
              Intro Screen
            </Button>
          </Link>
          <Link href="/admin/quiz/questions/create">
            <Button className="bg-blue-900 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20">
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
             <div className="flex flex-col items-center gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
                <p>Loading your quiz structure...</p>
             </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
            <FileQuestion className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-blue-950">No questions yet</h3>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Start building your quiz by adding your first question. You can choose between single and multiple choice formats.
          </p>
          <Link href="/admin/quiz/questions/create">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Create First Question
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div
              key={question.id}
              draggable
              onDragStart={() => handleDragStart(question.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(question.id)}
              className={cn(
                "group relative flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-2 pr-4 shadow-sm transition-all duration-200",
                "hover:border-blue-300 hover:shadow-md",
                draggedId === question.id ? "opacity-50 border-blue-400 bg-blue-50 ring-2 ring-blue-200" : ""
              )}
            >
              {/* Drag Handle */}
              <div className="cursor-grab p-2 text-slate-300 hover:text-blue-600 active:cursor-grabbing">
                <GripVertical className="h-5 w-5" />
              </div>

              {/* Step Counter */}
              <div className="hidden sm:flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
                 {index + 1}
              </div>

              {/* Main Content */}
              <div className="flex-1 py-2">
                <div className="flex items-center gap-2 mb-1.5">
                    {/* Mobile Step Counter */}
                   <span className="sm:hidden text-xs font-bold text-blue-600 mr-1">#{index + 1}</span>
                   
                   {/* Type Badge */}
                   <span className={cn(
                     "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide border",
                     question.question_type === 'radio' 
                        ? "bg-sky-50 text-sky-700 border-sky-100" 
                        : "bg-indigo-50 text-indigo-700 border-indigo-100"
                   )}>
                      {question.question_type === 'radio' ? <CircleDot className="h-3 w-3" /> : <CheckSquare className="h-3 w-3" />}
                      {question.question_type === 'radio' ? 'Single Choice' : 'Multi Choice'}
                   </span>
                </div>
                
                <h3 className="text-base font-semibold text-slate-800 line-clamp-1">
                  {question.question_text}
                </h3>
                
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <ListChecks className="h-3 w-3" />
                  {question.quiz_answer_options.length} options configured
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <Link href={`/admin/quiz/questions/${question.id}/edit`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(question.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <div className="pt-4 flex justify-center">
             <p className="text-xs text-slate-400 italic flex items-center gap-1.5">
               <GripVertical className="h-3 w-3" />
               Drag and drop items to reorder the sequence
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
