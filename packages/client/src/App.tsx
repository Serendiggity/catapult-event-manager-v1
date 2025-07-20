import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { EventsPage } from '@/pages/EventsPage'
import { ContactsPage } from '@/pages/ContactsPage'
import { ContactDetailsPage } from '@/pages/ContactDetailsPage'
import { ContactsListPage } from '@/pages/ContactsListPage'
import { ReviewQueuePage } from '@/pages/ReviewQueuePage'
import { LeadGroupsPage } from '@/pages/LeadGroupsPage'
import { CampaignsPage } from '@/pages/CampaignsPage'

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<EventsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/contacts" element={<ContactsListPage />} />
          <Route path="/events/:eventId/contacts/new" element={<ContactsPage />} />
          <Route path="/contacts/:id" element={<ContactDetailsPage />} />
          <Route path="/events/:eventId/review" element={<ReviewQueuePage />} />
          <Route path="/events/:eventId/groups" element={<LeadGroupsPage />} />
          <Route path="/events/:eventId/campaigns" element={<CampaignsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App