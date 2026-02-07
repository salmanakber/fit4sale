# Survey Scoring System Implementation

## Overview
A comprehensive point-based scoring system has been implemented for the survey/quiz application, allowing administrators to assign numerical scores to each answer option and view detailed evaluation results with graphical representations.

## Changes Made

### 1. Database Schema Updates
- **quiz_answer_options table**: Added `score` column (INTEGER, 0-100) to store points for each answer option
- **quiz_questions table**: Added `category` column (TEXT) to categorize questions for grouped analysis

### 2. Frontend - Question Form (`components/question-form.tsx`)
**New Features:**
- **Score Input Column**: Each answer option now has a dedicated numeric input field (0-100 points)
- **Category Field**: New dropdown/input field to assign categories to questions (e.g., "Fitness", "Nutrition", "Health")
- **Enhanced Option Interface**: Extended to include `score` property alongside `option_text` and `value`

**Visual Updates:**
- Added score column to the option table header with helpful tooltip
- Score input field displays in the right-aligned column
- Maintained responsive design across mobile and desktop

### 3. API Endpoints

#### POST `/api/admin/quiz/questions` (Create Question)
- Now accepts `category` field
- Saves answer `score` values to database
- Handles score validation (0-100 range)

#### PUT `/api/admin/quiz/questions/[id]` (Update Question)
- Updates question category
- Updates answer scores when options are modified
- Maintains backward compatibility

#### GET `/api/admin/quiz/questions` & `/api/admin/quiz/questions/[id]`
- Returns `category` field for each question
- Returns `score` field for each answer option

#### NEW: GET `/api/evaluations` (Evaluation Results API)
- Aggregates all submission data with point-based scoring
- Calculates individual question results with achieved vs. benchmark scores
- Groups results by category
- Returns comprehensive data structure for the Auswertungen page:
  ```json
  {
    "submissionId": "uuid",
    "participantName": "string",
    "participantEmail": "string",
    "submittedAt": "timestamp",
    "totalScore": number,
    "benchmarkScore": number,
    "deviation": number,
    "questionResults": [
      {
        "questionId": "uuid",
        "questionText": "string",
        "category": "string",
        "answerValue": "string",
        "achievedScore": number,
        "benchmarkScore": number,
        "deviation": number
      }
    ],
    "categoryResults": [
      {
        "category": "string",
        "totalScore": number,
        "benchmarkScore": number,
        "percentage": number,
        "questionCount": number
      }
    ]
  }
  ```

### 4. Auswertungen (Evaluation Results) Page (`app/admin/evaluations/page.tsx`)

**Comprehensive Visualization Features:**

1. **Summary Metrics**
   - Average Achieved Points across all evaluations
   - Average Benchmark Standard
   - Average Deviation (difference from benchmark)

2. **Category Breakdown Bar Chart**
   - Compares average scores per category
   - Shows achieved vs. benchmark side-by-side
   - Supports variable number of categories

3. **Detailed Results (Expanded View)**
   - Click on any evaluation to see detailed breakdown
   - Score summary cards (achieved, benchmark, deviation)
   - Question-by-question breakdown with:
     - Question text
     - Selected answer
     - Category badge
     - Score comparison
     - Visual progress bar

4. **Radar/Spider Chart (Multi-dimensional)**
   - Visualizes performance across all categories simultaneously
   - Overlays achieved vs. benchmark scores
   - Helpful for identifying strong/weak areas at a glance

5. **Trend Chart (Time Series)**
   - Shows score development over time
   - Displays both achieved and benchmark lines
   - Useful for tracking improvements

6. **Interactive Filter**
   - Filter evaluations by participant email
   - Real-time results count
   - Refresh button for manual updates

7. **Results List**
   - Interactive list of all evaluations
   - Shows name, email, date, and score summary
   - Click to select and view detailed breakdown
   - Scrollable for many results

**Design Features:**
- Clean, modern UI with Tailwind CSS
- Color-coded metrics (blue: achieved, green: benchmark, amber: deviation)
- Responsive layout for all screen sizes
- Loading states and empty states handled
- Smooth transitions and interactive elements

## Workflow

### Admin Setup
1. **Create/Edit Questions** in the question form
2. **Assign Scores** to each answer option (0-100 points)
3. **Set Category** for each question
4. **Set Benchmarks** in the Benchmarks admin page for comparison standards

### User Experience
1. User completes survey with single/multiple choice questions
2. Submission is saved with responses
3. System calculates points based on selected answers

### Admin Analysis
1. Navigate to **Auswertungen** page
2. View aggregate statistics and charts
3. Filter results by email if needed
4. Click individual results to see detailed breakdown
5. Analyze category performance with radar chart
6. Track trends over time with trend chart

## Technical Notes

- Scores are stored as integers (0-100)
- The evaluation API automatically compares achieved scores against benchmarks
- Category field defaults to "general" if not specified
- Deviation = Achieved Score - Benchmark Score
- All calculations handle edge cases (missing benchmarks, zero divisions)
- The Auswertungen page uses Recharts for visualizations
- RLS policies on existing tables remain unchanged

## Future Enhancements

- Export evaluations to CSV/PDF
- Advanced filtering options (date range, category)
- Score threshold alerts/recommendations
- Historical comparison (before/after)
- Custom benchmark per client/group
- Weighted scoring for different question types
