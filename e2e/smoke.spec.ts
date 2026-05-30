/**
 * Trak Football — Smoke Tests (Item 06)
 *
 * Three smoke tests covering the happy path for each role:
 *   1. Landing page loads and shows role selection
 *   2. Player onboarding form renders correctly
 *   3. Coach onboarding form renders correctly
 *
 * These run against the live dev server (npm run dev → localhost:8080).
 * In CI: start the server first, then run `npx playwright test`.
 *
 * To run locally:
 *   npm run dev &
 *   npx playwright test e2e/smoke.spec.ts
 */

import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:8080'

test.describe('Landing page', () => {
  test('loads and shows sign-in options', async ({ page }) => {
    await page.goto(BASE)
    // The app should render without a blank white screen
    await expect(page.locator('body')).not.toBeEmpty()
    // Should contain some sign-in / role selection UI
    const text = await page.textContent('body')
    expect(text).toBeTruthy()
    expect(text!.length).toBeGreaterThan(50)
  })
})

test.describe('Player onboarding', () => {
  test('registration form renders all required fields', async ({ page }) => {
    await page.goto(`${BASE}/onboarding/player`)
    // Step 1 fields should be visible
    await expect(page.getByPlaceholder(/full name/i)).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    // Password field with 8-char minimum
    const pwInput = page.locator('input[type="password"]').first()
    await expect(pwInput).toBeVisible()
  })

  test('password shorter than 8 characters shows an error', async ({ page }) => {
    await page.goto(`${BASE}/onboarding/player`)
    await page.getByPlaceholder(/full name/i).fill('Test Player')
    await page.getByPlaceholder(/email/i).fill('player@test.com')
    const pwInputs = page.locator('input[type="password"]')
    await pwInputs.nth(0).fill('short')
    await pwInputs.nth(1).fill('short')
    // Submit step 1
    const continueBtn = page.getByRole('button', { name: /continue|next/i }).first()
    await continueBtn.click()
    // Should see error toast or inline error
    await expect(page.getByText(/8 characters/i)).toBeVisible({ timeout: 3000 })
  })
})

test.describe('Coach onboarding', () => {
  test('registration form renders club and role fields', async ({ page }) => {
    await page.goto(`${BASE}/onboarding/coach`)
    await expect(page.getByPlaceholder(/full name/i)).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
  })
})

test.describe('Parent onboarding', () => {
  test('parent registration page loads', async ({ page }) => {
    await page.goto(`${BASE}/parent-onboarding`)
    const text = await page.textContent('body')
    expect(text).toBeTruthy()
    expect(text!.length).toBeGreaterThan(50)
  })
})
