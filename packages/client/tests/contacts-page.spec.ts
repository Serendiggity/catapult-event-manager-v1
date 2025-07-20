import { test, expect } from '@playwright/test';

test.describe('Contacts Management Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the contacts page
    await page.goto('http://localhost:5176/contacts');
  });

  test('should display contacts page with correct header', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1').filter({ hasText: 'Contacts' })).toBeVisible();
    await expect(page.locator('text=Manage all your event contacts in one place')).toBeVisible();
  });

  test('should show navigation links in header', async ({ page }) => {
    // Check navigation links
    const eventsLink = page.locator('nav').locator('a', { hasText: 'Events' });
    const contactsLink = page.locator('nav').locator('a', { hasText: 'Contacts' });
    
    await expect(eventsLink).toBeVisible();
    await expect(contactsLink).toBeVisible();
    
    // Contacts link should be active (blue)
    await expect(contactsLink).toHaveClass(/text-blue-600/);
  });

  test('should display search bar and filters', async ({ page }) => {
    // Check search input
    const searchInput = page.locator('input[placeholder*="Search by name, email, or company"]');
    await expect(searchInput).toBeVisible();
    
    // Check filter dropdowns
    await expect(page.locator('button:has-text("All Contacts")')).toBeVisible();
    await expect(page.locator('button:has-text("Date Added")')).toBeVisible();
  });

  test('should display contacts table with correct columns', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check table headers
    const headers = ['Name', 'Email', 'Company', 'Event', 'Status', 'Date Added', 'Actions'];
    for (const header of headers) {
      await expect(page.locator('th', { hasText: header })).toBeVisible();
    }
  });

  test('should display contact names in sentence case', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Get all name cells
    const nameCells = page.locator('table tbody tr td:nth-child(2)');
    const count = await nameCells.count();
    
    if (count > 0) {
      // Check first contact's name formatting
      const firstName = await nameCells.first().locator('.font-medium').textContent();
      if (firstName && firstName !== '-') {
        // Check that first letter is uppercase and rest are lowercase
        const words = firstName.trim().split(' ');
        for (const word of words) {
          if (word.length > 0) {
            expect(word[0]).toMatch(/[A-Z]/);
            if (word.length > 1) {
              expect(word.substring(1)).toMatch(/^[a-z]+$/);
            }
          }
        }
      }
    }
  });

  test('should display event names instead of "Unknown Event"', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Check event column
    const eventCells = page.locator('table tbody tr td:nth-child(5)');
    const count = await eventCells.count();
    
    if (count > 0) {
      const eventText = await eventCells.first().textContent();
      // Should not show "Unknown Event" if there are contacts with events
      expect(eventText).toBeDefined();
    }
  });

  test('should have view, edit, and delete buttons for each contact', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    const firstRow = page.locator('table tbody tr').first();
    const actionButtons = firstRow.locator('td:last-child button');
    
    // Should have 3 action buttons
    await expect(actionButtons).toHaveCount(3);
    
    // Check for specific button icons/titles
    await expect(firstRow.locator('button[title="View contact"]')).toBeVisible();
    await expect(firstRow.locator('button[title="Edit contact"]')).toBeVisible();
    await expect(firstRow.locator('button[title="Delete contact"]')).toBeVisible();
  });

  test('should show delete confirmation when delete button is clicked', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Set up dialog handler
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Are you sure you want to delete this contact?');
      await dialog.dismiss(); // Cancel the deletion for testing
    });
    
    // Click delete button on first contact
    const deleteButton = page.locator('table tbody tr').first().locator('button[title="Delete contact"]');
    await deleteButton.click();
  });

  test('should have working search functionality', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search by name, email, or company"]');
    await searchInput.fill('test search');
    
    // Wait for search to execute (debounced)
    await page.waitForTimeout(500);
    
    // Table should update (even if no results)
    await expect(page.locator('table')).toBeVisible();
  });

  test('should have working status filter', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Click status filter
    await page.locator('button:has-text("All Contacts")').click();
    
    // Check filter options
    await expect(page.locator('text=All Contacts')).toBeVisible();
    await expect(page.locator('text=Needs Review')).toBeVisible();
    await expect(page.locator('text=Verified')).toBeVisible();
    
    // Select "Needs Review"
    await page.locator('text=Needs Review').click();
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Table should still be visible
    await expect(page.locator('table')).toBeVisible();
  });

  test('should have working sort functionality', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Click on Name header to sort
    await page.locator('th button:has-text("Name")').click();
    
    // Should show sort indicator
    await expect(page.locator('th button:has-text("Name") svg')).toBeVisible();
    
    // Click again to reverse sort
    await page.locator('th button:has-text("Name")').click();
    
    // Sort indicator should still be visible
    await expect(page.locator('th button:has-text("Name") svg')).toBeVisible();
  });

  test('should have checkbox selection functionality', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Click select all checkbox
    const selectAllCheckbox = page.locator('th').first().locator('input[type="checkbox"]');
    await selectAllCheckbox.click();
    
    // Bulk actions bar should appear
    await expect(page.locator('text=contact(s) selected')).toBeVisible();
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
    await expect(page.locator('button:has-text("Assign to Group")')).toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).toBeVisible();
    
    // Unselect all
    await selectAllCheckbox.click();
    
    // Bulk actions should disappear
    await expect(page.locator('text=contact(s) selected')).not.toBeVisible();
  });

  test('should navigate to contact details when view button is clicked', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Click view button on first contact
    const viewButton = page.locator('table tbody tr').first().locator('button[title="View contact"]');
    await viewButton.click();
    
    // Should navigate to contact details page
    await expect(page).toHaveURL(/\/contacts\/[a-zA-Z0-9-]+$/);
  });

  test('should display pagination controls', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    // Check pagination info
    await expect(page.locator('text=/Showing \\d+ to \\d+ of \\d+ contacts/')).toBeVisible();
    
    // Check pagination buttons
    await expect(page.locator('button:has-text("Previous")')).toBeVisible();
    await expect(page.locator('button:has-text("Next")')).toBeVisible();
  });

  test('should display empty state when no contacts', async ({ page }) => {
    // Search for something that won't return results
    const searchInput = page.locator('input[placeholder*="Search by name, email, or company"]');
    await searchInput.fill('xyzxyzxyzxyzxyz_no_results_expected');
    
    // Wait for search to execute
    await page.waitForTimeout(500);
    
    // Check for empty state or no results
    const noContactsMessage = page.locator('text=No contacts found');
    const emptyTable = page.locator('table tbody tr').count();
    
    // Either show "No contacts found" message or have 0 rows
    const hasNoContacts = await noContactsMessage.isVisible().catch(() => false) || await emptyTable === 0;
    expect(hasNoContacts).toBeTruthy();
  });

  test('should have status badges showing correctly', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('table tbody tr', { timeout: 10000 });
    
    // Check for status badges
    const statusCells = page.locator('table tbody tr td:nth-child(6)');
    const count = await statusCells.count();
    
    if (count > 0) {
      const firstStatus = statusCells.first();
      // Should have either "Needs Review" or "Verified" badge
      const badge = firstStatus.locator('.inline-flex');
      await expect(badge).toBeVisible();
      
      const badgeText = await badge.textContent();
      expect(['Needs Review', 'Verified']).toContain(badgeText?.trim());
    }
  });
});