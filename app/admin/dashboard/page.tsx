'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React from "react"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'


export default function AdminDashboard() {


  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h2>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="text-sm text-muted-foreground">Total Submissions</div>
            <div className="mt-2 text-3xl font-bold text-foreground">--</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="text-sm text-muted-foreground">Pending Evaluations</div>
            <div className="mt-2 text-3xl font-bold text-foreground">--</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="text-sm text-muted-foreground">Completed Evaluations</div>
            <div className="mt-2 text-3xl font-bold text-foreground">--</div>
          </div>
        </div>
      </div>

      <div className="border-t pt-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/admin/quiz">
            <Button className="w-full justify-start h-auto p-4 bg-transparent" variant="outline">
              <div>
                <div className="font-semibold text-foreground">Manage Quiz</div>
                <p className="text-sm text-muted-foreground">
                  Edit questions, answer options, and intro screen
                </p>
              </div>
            </Button>
          </Link>
          <Link href="/admin/submissions">
            <Button className="w-full justify-start h-auto p-4 bg-transparent" variant="outline">
              <div>
                <div className="font-semibold text-foreground">View Submissions</div>
                <p className="text-sm text-muted-foreground">
                  Review quiz responses from users
                </p>
              </div>
            </Button>
          </Link>
          <Link href="/admin/evaluations">
            <Button className="w-full justify-start h-auto p-4 bg-transparent" variant="outline">
              <div>
                <div className="font-semibold text-foreground">Manage Evaluations</div>
                <p className="text-sm text-muted-foreground">
                  Create and send fitness evaluations
                </p>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
