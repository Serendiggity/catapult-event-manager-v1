import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { EventsPage } from '@/pages/EventsPage'
import { EventDetailsPage } from '@/pages/EventDetailsPage'
import { EventCreatePage } from '@/pages/EventCreatePage'
import { EventEditPage } from '@/pages/EventEditPage'
import { ContactsPage } from '@/pages/ContactsPage'
import { ContactDetailsPage } from '@/pages/ContactDetailsPage'
import { ContactsListPage } from '@/pages/ContactsListPage'
import { ReviewQueuePage } from '@/pages/ReviewQueuePage'
import { CampaignGroupsPage } from '@/pages/CampaignGroupsPage'
import { CampaignsPage } from '@/pages/CampaignsPage'
import { AllCampaignGroupsPage } from '@/pages/AllCampaignGroupsPage'
import { AllCampaignsPage } from '@/pages/AllCampaignsPage'
import { CampaignDetailsPage } from '@/pages/CampaignDetailsPage'
import { CampaignWizard } from '@/components/campaigns/CampaignWizard'
import { QuickEmailPage } from '@/pages/QuickEmailPage'
import { NavbarDemoPage } from '@/pages/NavbarDemoPage'
import { DashboardPage } from '@/pages/DashboardPage'

function App() {
  console.log('App component rendering');
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <OnboardingProvider>
          <Layout>
            <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/new" element={<EventCreatePage />} />
            <Route path="/events/:id" element={<EventDetailsPage />} />
            <Route path="/events/:id/edit" element={<EventEditPage />} />
            <Route path="/contacts" element={<ContactsListPage />} />
            <Route path="/campaign-groups" element={<AllCampaignGroupsPage />} />
            <Route path="/campaigns" element={<AllCampaignsPage />} />
            <Route path="/campaigns/:campaignId" element={<CampaignDetailsPage />} />
            <Route path="/events/:eventId/contacts/new" element={<ContactsPage />} />
            <Route path="/contacts/:id" element={<ContactDetailsPage />} />
            <Route path="/events/:eventId/review" element={<ReviewQueuePage />} />
            <Route path="/events/:eventId/campaign-groups" element={<CampaignGroupsPage />} />
            <Route path="/events/:eventId/campaigns" element={<CampaignsPage />} />
            <Route path="/events/:eventId/campaigns/new" element={<CampaignWizard />} />
            <Route path="/quick-email" element={<QuickEmailPage />} />
            <Route path="/navbar-demo" element={<NavbarDemoPage />} />
          </Routes>
        </Layout>
        <Toaster />
      </OnboardingProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App