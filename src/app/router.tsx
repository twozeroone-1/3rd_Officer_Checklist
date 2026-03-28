import { createBrowserRouter } from 'react-router-dom';

import { AppLayout } from './App';
import { DocumentsPage } from '../features/documents/DocumentsPage';
import { CalendarPage } from '../features/calendar/CalendarPage';
import { HomePage } from '../features/home/HomePage';
import { NotesPage } from '../features/notes/NotesPage';
import { RoutinePage } from '../features/routine/RoutinePage';
import { ScenarioSessionPage } from '../features/scenarios/ScenarioSessionPage';
import { ScenariosPage } from '../features/scenarios/ScenariosPage';
import { SettingsPage } from '../features/settings/SettingsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'routine',
        element: <RoutinePage />,
      },
      {
        path: 'scenarios',
        element: <ScenariosPage />,
      },
      {
        path: 'scenarios/:sessionId',
        element: <ScenarioSessionPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'documents',
        element: <DocumentsPage />,
      },
      {
        path: 'notes',
        element: <NotesPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
]);
