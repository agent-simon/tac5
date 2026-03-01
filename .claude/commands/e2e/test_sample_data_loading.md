# E2E Test: Sample Data Loading

Test the quick-start sample data buttons in the upload modal of the Natural Language SQL Interface application.

## User Story

As a new user
I want to load pre-built sample datasets with one click
So that I can start exploring the application without preparing my own data

## Test Steps

1. Navigate to the `Application URL`
2. Take a screenshot of the initial state
3. **Verify** the "Upload Data" button (`#upload-data-button`) is present in the `.query-controls` area
4. Click the "Upload Data" button to open the upload modal
5. **Verify** the upload modal (`#upload-modal`) is visible
6. **Verify** three sample data buttons (`.sample-button`) are present inside `.sample-buttons`:
   - "Users Data" button with `data-sample="users"`
   - "Product Inventory" button with `data-sample="products"`
   - "Event Analytics" button with `data-sample="events"`
7. Take a screenshot of the upload modal showing the sample data buttons

8. Click the "Users Data" sample button (`[data-sample="users"]`)
9. Wait for the modal to close and for a `.success-message` to appear
10. **Verify** the upload modal (`#upload-modal`) is hidden
11. **Verify** a `.success-message` is displayed containing "users" and "created successfully"
12. **Verify** "users" appears as a `.table-name` in the `#tables-list` section
13. Take a screenshot showing the success message and the users table in Available Tables

14. Click the "Upload Data" button again to reopen the modal
15. Click the "Product Inventory" sample button (`[data-sample="products"]`)
16. Wait for the modal to close and for a `.success-message` to appear
17. **Verify** the upload modal is hidden
18. **Verify** a `.success-message` is displayed containing "products" and "created successfully"
19. **Verify** "products" appears as a `.table-name` in the `#tables-list` section
20. Take a screenshot showing the products table in Available Tables

21. Click the "Upload Data" button again to reopen the modal
22. Click the "Event Analytics" sample button (`[data-sample="events"]`)
23. Wait for the modal to close and for a `.success-message` to appear
24. **Verify** the upload modal is hidden
25. **Verify** a `.success-message` is displayed containing "events" and "created successfully"
26. **Verify** "events" appears as a `.table-name` in the `#tables-list` section
27. **Verify** all three tables (users, products, events) are listed in `#tables-list`
28. Take a screenshot showing all three tables in Available Tables

## Success Criteria
- Upload modal opens when "Upload Data" button is clicked
- All three sample data buttons are present with correct labels
- Clicking each sample button loads the dataset, closes the modal, and shows a success message
- Each loaded table appears in the Available Tables section
- All three tables coexist after loading all sample datasets
- 5 screenshots are taken
