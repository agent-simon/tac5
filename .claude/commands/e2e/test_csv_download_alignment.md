# E2E Test: CSV Download Button Alignment

Test that the CSV download button is visually grouped next to the remove button in the table header, not floating in the center.

## User Story

As a user
I want the download and remove buttons to be grouped together on the right side of the table header
So that the interface looks clean and the action buttons are easy to find

## Test Steps

1. Navigate to the `Application URL`
2. Click the "Upload Data" button (`#upload-data-button`) to open the upload modal
3. **Verify** the upload modal (`#upload-modal`) is visible
4. Click the sample data button with `data-sample="products"` to load the Products sample data
5. Wait for the modal to close and the schema to refresh
6. **Verify** a `.table-item` element exists in `#tables-list` containing "products" in `.table-name`
7. **Verify** a `.download-table-button` element is visible inside the `products` table card
8. **Verify** the `.download-table-button` and `.remove-table-button` inside the `products` table card share the same parent element (i.e. they are siblings within a button group container that is a direct child of `.table-header`)
9. **Verify** via bounding box that the download button's right edge is adjacent to (within 16px of) the remove button's left edge
10. Take a screenshot of the table card header showing the buttons are grouped on the right
11. Click the `.download-table-button` inside the `products` table card using Playwright's `waitForEvent('download')` to confirm the download still triggers
12. **Verify** the download event fires with suggested filename `products.csv`
13. Take a screenshot after the download was triggered

## Success Criteria
- Download button (`.download-table-button`) and remove button (`.remove-table-button`) are siblings within the same parent container
- Both buttons are visually grouped on the right side of the table header
- The download button's right edge is within 16px of the remove button's left edge
- The download button still triggers a file download
- 2 screenshots are taken
