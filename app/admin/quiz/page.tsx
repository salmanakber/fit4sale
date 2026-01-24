'use client';

import React from "react"

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

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
      alert('Failed to delete question');
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

    setQuestions(newQuestions);

    // Update order on server
    const questionIds = newQuestions.map((q) => q.id);
    try {
      const response = await fetch('/api/admin/quiz/questions/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionIds }),
      });
      if (!response.ok) throw new Error('Failed to reorder questions');
    } catch (error) {
      console.error('Error reordering questions:', error);
      alert('Failed to reorder questions');
      await fetchQuestions();
    }

    setDraggedId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Quiz Questions</h1>
          <p className="text-foreground/60 mt-2">
            Add, edit, remove, and reorder survey questions
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/quiz/intro">
            <Button variant="outline">Edit Intro Screen</Button>
          </Link>
          <Link href="/admin/quiz/questions/create">
            <Button>Add Question</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-foreground/60">Loading questions...</p>
      ) : questions.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-foreground/60 mb-4">No questions yet.</p>
          <Link href="/admin/quiz/questions/create">
            <Button>Create First Question</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <Card
              key={question.id}
              draggable
              onDragStart={() => handleDragStart(question.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(question.id)}
              className="p-4 cursor-move hover:bg-muted transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-primary">
                      Step {question.order_index + 1}
                    </span>
                    <span className="text-xs px-2 py-1 bg-secondary rounded-full text-foreground">
                      {question.question_type === 'radio' ? 'Single Choice' : 'Multiple Choice'}
                    </span>
                  </div>
                  <p className="text-foreground font-medium">
                    {question.question_text}
                  </p>
                  <p className="text-sm text-foreground/60 mt-2">
                    {question.quiz_answer_options.length} option
                    {question.quiz_answer_options.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/quiz/questions/${question.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(question.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-foreground/50 italic pt-4">
        Drag and drop questions to reorder them
      </p>
    </div>
  );
}
