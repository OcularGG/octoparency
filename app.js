// Supabase configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hardcoded admin credentials (for demonstration purposes only)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin'
};

// Financial data categories organized by groups
const dataCategories = [
    // Assets
    { id: 'total_assets', name: 'Total Assets', group: 'Assets', calculated: true },
    { id: 'total_liquid_assets', name: 'Total Liquid Assets', group: 'Assets', calculated: true },
    { id: 'total_illiquid_assets', name: 'Total Illiquid Assets', group: 'Assets', calculated: true },
    { id: 'net_liquid', name: 'Net Liquid', group: 'Assets' },
    { id: 'liquid_change', name: 'Liquid Change', group: 'Assets' },
    { id: 'outstanding_payments', name: 'Outstanding Payments to Members', group: 'Assets' },
    
    // Guild Silver
    { id: 'ocular_silver', name: 'OCULAR Silver', group: 'Guild Silver' },
    { id: 'university_silver', name: 'OCULAR University Silver', group: 'Guild Silver' },
    { id: 'vanguard_silver', name: 'OCULAR Vanguard Silver', group: 'Guild Silver' },
    
    // Sellable Items
    { id: 'total_liquid_items', name: 'Total Liquid Items', group: 'Sellable Items', calculated: true },
    { id: 'sellable_siv_ho', name: 'Sellable Items in SIV HO', group: 'Sellable Items' },
    { id: 'sellable_delta_hq', name: 'Sellable Items in Delta HQ', group: 'Sellable Items' },
    { id: 'sellable_coast_hq', name: 'Sellable Items in Coast HQ', group: 'Sellable Items' },
    { id: 'sellable_martlock', name: 'Sellable Items in Martlock', group: 'Sellable Items' },
    { id: 'sellable_thetford', name: 'Sellable Items in Thetford', group: 'Sellable Items' },
    { id: 'sellable_lymhurst', name: 'Sellable Items in Lymhurst', group: 'Sellable Items' },
    { id: 'sellable_bridgewatch', name: 'Sellable Items in Bridgewatch', group: 'Sellable Items' },
    { id: 'sellable_fort_sterling', name: 'Sellable Items in Fort Sterling', group: 'Sellable Items' },
    { id: 'sellable_brecilien', name: 'Sellable Items in Brecilien', group: 'Sellable Items' },
    { id: 'sellable_caerleon', name: 'Sellable Items in Caerleon', group: 'Sellable Items' },
    
    // Illiquid Assets
    { id: 'illiquid_siv_ho', name: 'Random Illiquid Assets in SIV HO', group: 'Illiquid Assets' },
    { id: 'illiquid_delta_hq', name: 'Random Illiquid Assets in Delta HQ', group: 'Illiquid Assets' },
    { id: 'illiquid_coast_hq', name: 'Random Illiquid Assets in Coast HQ', group: 'Illiquid Assets' },
    { id: 'illiquid_martlock', name: 'Random Illiquid Assets in Martlock', group: 'Illiquid Assets' },
    { id: 'illiquid_thetford', name: 'Random Illiquid Assets in Thetford', group: 'Illiquid Assets' },
    { id: 'illiquid_lymhurst', name: 'Random Illiquid Assets in Lymhurst', group: 'Illiquid Assets' },
    { id: 'illiquid_bridgewatch', name: 'Random Illiquid Assets in Bridgewatch', group: 'Illiquid Assets' },
    { id: 'illiquid_fort_sterling', name: 'Random Illiquid Assets in Fort Sterling', group: 'Illiquid Assets' },
    { id: 'illiquid_brecilien', name: 'Random Illiquid Assets in Brecilien', group: 'Illiquid Assets' },
    { id: 'illiquid_caerleon', name: 'Random Illiquid Assets in Caerleon', group: 'Illiquid Assets' },
    
    // Membership
    { id: 'total_members', name: 'Total Members', group: 'Membership', calculated: true },
    { id: 'total_active_members', name: 'Total Active Members', group: 'Membership', calculated: true },
    { id: 'ocular_members', name: 'Total Members in OCULAR', group: 'Membership' },
    { id: 'university_members', name: 'Total Members in OCULAR University', group: 'Membership' },
    { id: 'vanguard_members', name: 'Total Members in OCULAR Vanguard', group: 'Membership' },
    { id: 'ocular_active_members', name: 'Total Active Members in OCULAR', group: 'Membership' },
    { id: 'university_active_members', name: 'Total Active Members in OCULAR University', group: 'Membership' },
    { id: 'vanguard_active_members', name: 'Total Active Members in OCULAR Vanguard', group: 'Membership' }
];

// DOM elements
const financialTable = document.getElementById('financial-data');
const refreshButton = document.getElementById('refresh-btn');
const loginButton = document.getElementById('admin-login-btn');
const logoutButton = document.getElementById('logout-btn');
const lastUpdatedElement = document.getElementById('last-updated');
const financialForm = document.getElementById('financial-form');
const formGrid = document.querySelector('.form-grid');
const calculateButton = document.getElementById('calculate-btn');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const closeModalButton = document.querySelector('.close');

// Current data state
let currentData = null;
let isAdminMode = false;
let charts = {};

// Format numbers for display
function formatNumber(num) {
    return num ? num.toLocaleString() : '0';
}

// Parse number input value
function parseInputValue(value) {
    return parseInt(value.replace(/,/g, '')) || 0;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Fetch the latest financial data from Supabase
async function fetchLatestFinancialData() {
    try {
        const { data, error } = await supabase
            .from('financial_data')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        
        if (error) throw error;
        currentData = data;
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Populate the table with data
function populateTable(data) {
    if (!data) {
        financialTable.querySelector('tbody').innerHTML = '<tr><td colspan="3">No data available</td></tr>';
        return;
    }
    
    // Update the last updated timestamp
    lastUpdatedElement.textContent = formatDate(data.created_at);
    
    // Clear existing table data
    const tbody = financialTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Group categories and populate table
    let currentGroup = '';
    
    dataCategories.forEach(category => {
        // If this is a new group, add a group header row
        if (category.group !== currentGroup) {
            currentGroup = category.group;
            const groupRow = document.createElement('tr');
            groupRow.className = 'category-group';
            groupRow.innerHTML = `<td colspan="3">${currentGroup}</td>`;
            tbody.appendChild(groupRow);
        }
        
        // Add the data row
        const row = document.createElement('tr');
        row.dataset.category = category.id;
        const value = data[category.id] || 0;
        
        // Create cells - name cell and value cell
        const nameCell = document.createElement('td');
        nameCell.textContent = category.name;
        
        const valueCell = document.createElement('td');
        valueCell.textContent = formatNumber(value);
        valueCell.className = 'value-cell';
        valueCell.dataset.value = value;
        
        // Create action cell for admin mode
        const actionCell = document.createElement('td');
        actionCell.className = 'admin-only';
        
        if (!category.calculated) {
            const editButton = document.createElement('button');
            editButton.className = 'edit-btn';
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => makeValueEditable(valueCell, category.id));
            actionCell.appendChild(editButton);
        } else {
            actionCell.textContent = '(Calculated)';
        }
        
        // Append cells to row
        row.appendChild(nameCell);
        row.appendChild(valueCell);
        row.appendChild(actionCell);
        
        tbody.appendChild(row);
    });
}

// Make a cell editable
function makeValueEditable(cell, categoryId) {
    const currentValue = cell.dataset.value;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = formatNumber(currentValue);
    input.dataset.originalValue = currentValue;
    
    // Replace the cell content with the input
    cell.textContent = '';
    cell.appendChild(input);
    input.focus();
    
    // Handle input blur - save changes
    input.addEventListener('blur', function() {
        const newValue = parseInputValue(this.value);
        cell.textContent = formatNumber(newValue);
        cell.dataset.value = newValue;
        
        // Update current data
        if (currentData) {
            currentData[categoryId] = newValue;
            calculateTotals();
        }
    });
    
    // Handle Enter key
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            this.blur();
        } else if (e.key === 'Escape') {
            // Restore original value on Escape
            cell.textContent = formatNumber(this.dataset.originalValue);
            cell.dataset.value = this.dataset.originalValue;
        }
    });
}

// Generate the data entry form
function generateDataEntryForm() {
    formGrid.innerHTML = '';
    let currentGroup = '';
    
    dataCategories.forEach(category => {
        // Skip calculated fields in the form
        if (category.calculated) return;
        
        // If this is a new group, add a group header
        if (category.group !== currentGroup) {
            currentGroup = category.group;
            const groupHeader = document.createElement('div');
            groupHeader.className = 'group-header';
            groupHeader.textContent = currentGroup;
            formGrid.appendChild(groupHeader);
        }
        
        // Create form group
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        // Create label
        const label = document.createElement('label');
        label.setAttribute('for', `form-${category.id}`);
        label.textContent = category.name;
        
        // Create input
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `form-${category.id}`;
        input.name = category.id;
        input.placeholder = '0';
        
        if (currentData && currentData[category.id]) {
            input.value = formatNumber(currentData[category.id]);
        }
        
        // Add elements to form group
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        
        // Add form group to grid
        formGrid.appendChild(formGroup);
    });
}

// Calculate totals based on current inputs
function calculateTotals() {
    if (!currentData) return;
    
    // Calculate total liquid items
    let totalLiquidItems = 0;
    [
        'sellable_siv_ho', 'sellable_delta_hq', 'sellable_coast_hq',
        'sellable_martlock', 'sellable_thetford', 'sellable_lymhurst',
        'sellable_bridgewatch', 'sellable_fort_sterling', 'sellable_brecilien', 'sellable_caerleon'
    ].forEach(id => {
        totalLiquidItems += parseInt(currentData[id] || 0);
    });
    currentData.total_liquid_items = totalLiquidItems;
    
    // Calculate total illiquid assets
    let totalIlliquidAssets = 0;
    [
        'illiquid_siv_ho', 'illiquid_delta_hq', 'illiquid_coast_hq',
        'illiquid_martlock', 'illiquid_thetford', 'illiquid_lymhurst',
        'illiquid_bridgewatch', 'illiquid_fort_sterling', 'illiquid_brecilien', 'illiquid_caerleon'
    ].forEach(id => {
        totalIlliquidAssets += parseInt(currentData[id] || 0);
    });
    currentData.total_illiquid_assets = totalIlliquidAssets;
    
    // Calculate total liquid assets (guild silver + liquid items)
    let totalLiquidAssets = totalLiquidItems;
    ['ocular_silver', 'university_silver', 'vanguard_silver'].forEach(id => {
        totalLiquidAssets += parseInt(currentData[id] || 0);
    });
    currentData.total_liquid_assets = totalLiquidAssets;
    
    // Calculate total assets
    currentData.total_assets = totalLiquidAssets + totalIlliquidAssets;
    
    // Calculate total members
    let totalMembers = 0;
    ['ocular_members', 'university_members', 'vanguard_members'].forEach(id => {
        totalMembers += parseInt(currentData[id] || 0);
    });
    currentData.total_members = totalMembers;
    
    // Calculate total active members
    let totalActiveMembers = 0;
    ['ocular_active_members', 'university_active_members', 'vanguard_active_members'].forEach(id => {
        totalActiveMembers += parseInt(currentData[id] || 0);
    });
    currentData.total_active_members = totalActiveMembers;
    
    // Update the display for calculated fields
    dataCategories.filter(cat => cat.calculated).forEach(category => {
        const row = financialTable.querySelector(`tr[data-category="${category.id}"]`);
        if (row) {
            const valueCell = row.querySelector('.value-cell');
            valueCell.textContent = formatNumber(currentData[category.id]);
            valueCell.dataset.value = currentData[category.id];
        }
    });
}

// Get form data
function getFormData() {
    const formData = {};
    
    dataCategories.forEach(category => {
        if (!category.calculated) {
            const input = document.getElementById(`form-${category.id}`);
            if (input) {
                formData[category.id] = parseInputValue(input.value);
            }
        }
    });
    
    return formData;
}

// Submit new financial data
async function submitFinancialData(formData) {
    try {
        // Calculate the derived fields
        const calculatedData = {...formData};
        
        // Calculate total liquid items
        let totalLiquidItems = 0;
        [
            'sellable_siv_ho', 'sellable_delta_hq', 'sellable_coast_hq',
            'sellable_martlock', 'sellable_thetford', 'sellable_lymhurst',
            'sellable_bridgewatch', 'sellable_fort_sterling', 'sellable_brecilien', 'sellable_caerleon'
        ].forEach(id => {
            totalLiquidItems += parseInt(formData[id] || 0);
        });
        calculatedData.total_liquid_items = totalLiquidItems;
        
        // Calculate total illiquid assets
        let totalIlliquidAssets = 0;
        [
            'illiquid_siv_ho', 'illiquid_delta_hq', 'illiquid_coast_hq',
            'illiquid_martlock', 'illiquid_thetford', 'illiquid_lymhurst',
            'illiquid_bridgewatch', 'illiquid_fort_sterling', 'illiquid_brecilien', 'illiquid_caerleon'
        ].forEach(id => {
            totalIlliquidAssets += parseInt(formData[id] || 0);
        });
        calculatedData.total_illiquid_assets = totalIlliquidAssets;
        
        // Calculate total liquid assets (guild silver + liquid items)
        let totalLiquidAssets = totalLiquidItems;
        ['ocular_silver', 'university_silver', 'vanguard_silver'].forEach(id => {
            totalLiquidAssets += parseInt(formData[id] || 0);
        });
        calculatedData.total_liquid_assets = totalLiquidAssets;
        
        // Calculate total assets
        calculatedData.total_assets = totalLiquidAssets + totalIlliquidAssets;
        
        // Calculate total members and active members
        let totalMembers = 0;
        let totalActiveMembers = 0;
        
        ['ocular_members', 'university_members', 'vanguard_members'].forEach(id => {
            totalMembers += parseInt(formData[id] || 0);
        });
        
        ['ocular_active_members', 'university_active_members', 'vanguard_active_members'].forEach(id => {
            totalActiveMembers += parseInt(formData[id] || 0);
        });
        
        calculatedData.total_members = totalMembers;
        calculatedData.total_active_members = totalActiveMembers;
        
        // Insert data into Supabase
        const { data, error } = await supabase
            .from('financial_data')
            .insert([calculatedData]);
        
        if (error) throw error;
        
        alert('Financial data submitted successfully!');
        return true;
    } catch (error) {
        console.error('Error submitting data:', error);
        alert('Error submitting data: ' + error.message);
        return false;
    }
}

// Login validation
function validateLogin(username, password) {
    return username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password;
}

// Toggle admin mode
function setAdminMode(isAdmin) {
    isAdminMode = isAdmin;
    document.body.classList.toggle('admin-mode', isAdminMode);
    
    if (isAdminMode) {
        loginButton.style.display = 'none';
        generateDataEntryForm();
    } else {
        loginButton.style.display = 'block';
    }
}

// Show login modal
function showLoginModal() {
    loginModal.style.display = 'block';
    document.getElementById('username').focus();
}

// Hide login modal
function hideLoginModal() {
    loginModal.style.display = 'none';
    loginForm.reset();
}

// Initialize the dashboard
async function initDashboard() {
    const data = await fetchLatestFinancialData();
    populateTable(data);
}

// Event listeners - FIX LOGIN MODAL ISSUE
document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements that might not be available immediately
    const loginButton = document.getElementById('admin-login-btn');
    const logoutButton = document.getElementById('logout-btn');
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const closeModalButton = document.querySelector('.close');
    
    // Login button event listener
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            if (loginModal) {
                loginModal.style.display = 'block';
                const usernameInput = document.getElementById('username');
                if (usernameInput) usernameInput.focus();
            } else {
                console.error("Login modal element not found!");
            }
        });
    }
    
    // Close button event listener
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function() {
            if (loginModal) {
                loginModal.style.display = 'none';
                if (loginForm) loginForm.reset();
            }
        });
    }
    
    // Click outside modal to close
    window.addEventListener('click', function(event) {
        if (event.target == loginModal) {
            loginModal.style.display = 'none';
            if (loginForm) loginForm.reset();
        }
    });
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            if (validateLogin(username, password)) {
                loginModal.style.display = 'none';
                loginForm.reset();
                setAdminMode(true);
            } else {
                alert('Invalid username or password');
            }
        });
    }
    
    // Logout button
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            setAdminMode(false);
        });
    }
    
    // Initialize the dashboard
    initDashboard();
});

// Remove the existing event listeners from the end of the file
// (keep all other functions intact, but remove these specific event listeners
// since we're now setting them up in the DOMContentLoaded event)

/*
refreshButton.addEventListener('click', initDashboard);
loginButton.addEventListener('click', showLoginModal);
logoutButton.addEventListener('click', function() {
    setAdminMode(false);
});
closeModalButton.addEventListener('click', hideLoginModal);
window.addEventListener('click', function(event) {
    if (event.target == loginModal) {
        hideLoginModal();
    }
});
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (validateLogin(username, password)) {
        hideLoginModal();
        setAdminMode(true);
    } else {
        alert('Invalid username or password');
    }
});
*/

// Keep the refreshButton, calculateButton and financialForm listeners
refreshButton.addEventListener('click', initDashboard);

calculateButton.addEventListener('click', function() {
    if (!currentData) currentData = {};
    
    // Get form values
    const formValues = {};
    dataCategories.filter(cat => !cat.calculated).forEach(category => {
        const input = document.getElementById(`form-${category.id}`);
        if (input) {
            formValues[category.id] = parseInputValue(input.value);
        }
    });
    
    // Update current data with form values
    Object.assign(currentData, formValues);
    
    // Calculate totals
    calculateTotals();
    
    // Update form with calculated values
    dataCategories.filter(cat => cat.calculated).forEach(category => {
        const valueDisplay = document.createElement('div');
        valueDisplay.className = 'calculated-value';
        valueDisplay.textContent = `${category.name}: ${formatNumber(currentData[category.id])}`;
        
        // Find existing display and replace or append
        const existingDisplay = document.querySelector(`.calculated-value:contains("${category.name}")`);
        if (existingDisplay) {
            existingDisplay.textContent = valueDisplay.textContent;
        } else {
            formGrid.insertBefore(valueDisplay, formGrid.firstChild);
        }
    });
});

financialForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = getFormData();
    const success = await submitFinancialData(formData);
    if (success) {
        initDashboard();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', initDashboard);

// Dashboard state
let charts = {};

// DOM content loaded - initialize everything
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initDashboard();
});

// Setup all event listeners
function setupEventListeners() {
    // Navigation
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Admin navigation
    const adminNavLinks = document.querySelectorAll('.admin-nav a');
    adminNavLinks.forEach(link => {
        link.addEventListener('click', handleAdminNavigation);
    });

    // Buttons
    const refreshButton = document.getElementById('refresh-btn');
    const loginButton = document.getElementById('admin-login-btn');
    const logoutButton = document.getElementById('logout-btn');
    const closeAdminButton = document.getElementById('close-admin-btn');
    const calculateButton = document.getElementById('calculate-btn');
    
    if (refreshButton) refreshButton.addEventListener('click', refreshData);
    if (loginButton) loginButton.addEventListener('click', showLoginModal);
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (closeAdminButton) closeAdminButton.addEventListener('click', closeAdminPanel);
    if (calculateButton) calculateButton.addEventListener('click', calculateTotals);

    // Login modal functionality
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const closeModalButton = document.querySelector('.close');
    
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            if (loginModal) {
                loginModal.style.display = 'block';
                const usernameInput = document.getElementById('username');
                if (usernameInput) usernameInput.focus();
            } else {
                console.error("Login modal element not found!");
            }
        });
    }
    
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function() {
            if (loginModal) {
                loginModal.style.display = 'none';
                if (loginForm) loginForm.reset();
            }
        });
    }
    
    window.addEventListener('click', function(event) {
        if (event.target == loginModal) {
            loginModal.style.display = 'none';
            if (loginForm) loginForm.reset();
        }
    });
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Form submission
    const financialForm = document.getElementById('financial-form');
    if (financialForm) {
        financialForm.addEventListener('submit', handleFormSubmit);
    }
}

// Handle navigation clicks
function handleNavigation(e) {
    e.preventDefault();
    
    // Update active class on nav items
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.parentElement.classList.remove('active');
    });
    this.parentElement.classList.add('active');
    
    // Show the corresponding section
    const sectionId = this.getAttribute('data-section');
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    
    // If we're showing a chart section, make sure charts are rendered
    if (sectionId === 'overview' || sectionId === 'assets' || sectionId === 'membership') {
        renderCharts();
    }
}

// Handle admin navigation clicks
function handleAdminNavigation(e) {
    e.preventDefault();
    
    // Update active class on nav items
    const navLinks = document.querySelectorAll('.admin-nav a');
    navLinks.forEach(link => {
        link.parentElement.classList.remove('active');
    });
    this.parentElement.classList.add('active');
    
    // Show the corresponding section
    const sectionId = this.getAttribute('data-section');
    const sections = document.querySelectorAll('.admin-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (validateLogin(username, password)) {
        document.getElementById('login-modal').style.display = 'none';
        this.reset();
        openAdminPanel();
    } else {
        alert('Invalid username or password');
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = getFormData();
    const success = await submitFinancialData(formData);
    if (success) {
        await refreshData();
        // Switch to edit data tab
        const editDataLink = document.querySelector('.admin-nav a[data-section="edit-data"]');
        if (editDataLink) editDataLink.click();
    }
}

// Open admin panel
function openAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.classList.add('active');
        setAdminMode(true);
        populateAdminTable(currentData);
        generateDataEntryForm();
    }
}

// Close admin panel
function closeAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.classList.remove('active');
        setAdminMode(false);
    }
}

// Handle logout
function handleLogout() {
    closeAdminPanel();
}

// Initialize dashboard data and views
async function initDashboard() {
    try {
        await refreshData();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// Refresh data from the database
async function refreshData() {
    try {
        const data = await fetchLatestFinancialData();
        if (data) {
            currentData = data;
            
            // Update all displays
            updateDashboardDisplays(data);
            populateDetailedTable(data);
            populateAssetsTable(data);
            populateMembershipTable(data);
            renderCharts();
            
            // If admin mode is active, update admin views
            if (isAdminMode) {
                populateAdminTable(data);
                generateDataEntryForm();
            }
        }
    } catch (error) {
        console.error('Error refreshing data:', error);
    }
}

// Update the dashboard displays with the latest data
function updateDashboardDisplays(data) {
    // Update last updated timestamp
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = formatDate(data.created_at);
    }
    
    // Update stat cards
    updateStatCard('total-assets-display', data.total_assets);
    updateStatCard('liquid-assets-display', data.total_liquid_assets);
    updateStatCard('illiquid-assets-display', data.total_illiquid_assets);
    updateStatCard('total-members-display', data.total_members);
    
    // Update percentages
    if (data.total_assets > 0) {
        const liquidPercentage = Math.round(data.total_liquid_assets / data.total_assets * 100);
        const illiquidPercentage = Math.round(data.total_illiquid_assets / data.total_assets * 100);
        
        updateElement('liquid-percentage', `${liquidPercentage}% of total`);
        updateElement('illiquid-percentage', `${illiquidPercentage}% of total`);
    }
    
    // Update member stats
    updateElement('active-members-display', `${formatNumber(data.total_active_members)} active`);
    
    // Update liquid change display
    const changeElement = document.getElementById('assets-change');
    if (changeElement && data.liquid_change) {
        const isPositive = data.liquid_change >= 0;
        const changeIcon = isPositive ? 'fa-arrow-up' : 'fa-arrow-down';
        const changeClass = isPositive ? 'positive' : 'negative';
        
        changeElement.innerHTML = `<i class="fas ${changeIcon}"></i> ${formatNumber(Math.abs(data.liquid_change))}`;
        changeElement.className = `stat-change ${changeClass}`;
    }
}

// Update a stat card value
function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = formatNumber(value);
    }
}

// Update any element's text content
function updateElement(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

// Populate the detailed data table
function populateDetailedTable(data) {
    const table = document.getElementById('financial-data');
    if (!table) return;
    
    populateTable(data);
}

// Populate the assets table
function populateAssetsTable(data) {
    const table = document.getElementById('assets-table');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Filter for asset-related categories
    const assetCategories = dataCategories.filter(cat => 
        cat.group === 'Assets' || 
        cat.group === 'Guild Silver' || 
        cat.group === 'Sellable Items' || 
        cat.group === 'Illiquid Assets'
    );
    
    // Group categories and populate table
    let currentGroup = '';
    
    assetCategories.forEach(category => {
        // If this is a new group, add a group header row
        if (category.group !== currentGroup) {
            currentGroup = category.group;
            const groupRow = document.createElement('tr');
            groupRow.className = 'category-group';
            groupRow.innerHTML = `<td colspan="2">${currentGroup}</td>`;
            tbody.appendChild(groupRow);
        }
        
        // Add the data row
        const row = document.createElement('tr');
        const value = data[category.id] || 0;
        
        row.innerHTML = `
            <td>${category.name}</td>
            <td>${formatNumber(value)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Populate the membership table
function populateMembershipTable(data) {
    const table = document.getElementById('membership-table');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Filter for membership-related categories
    const membershipCategories = dataCategories.filter(cat => cat.group === 'Membership');
    
    membershipCategories.forEach(category => {
        // Add the data row
        const row = document.createElement('tr');
        const value = data[category.id] || 0;
        
        row.innerHTML = `
            <td>${category.name}</td>
            <td>${formatNumber(value)}</td>
        `;
        
        tbody.appendChild(row);
    });
}

// Populate the admin table for editing data
function populateAdminTable(data) {
    const table = document.getElementById('admin-data-table');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Group categories and populate table
    let currentGroup = '';
    
    dataCategories.forEach(category => {
        // If this is a new group, add a group header row
        if (category.group !== currentGroup) {
            currentGroup = category.group;
            const groupRow = document.createElement('tr');
            groupRow.className = 'category-group';
            groupRow.innerHTML = `<td colspan="3">${currentGroup}</td>`;
            tbody.appendChild(groupRow);
        }
        
        // Add the data row
        const row = document.createElement('tr');
        row.dataset.category = category.id;
        const value = data[category.id] || 0;
        
        // Create cells - name cell and value cell
        const nameCell = document.createElement('td');
        nameCell.textContent = category.name;
        
        const valueCell = document.createElement('td');
        valueCell.textContent = formatNumber(value);
        valueCell.className = 'value-cell';
        valueCell.dataset.value = value;
        
        // Create action cell
        const actionCell = document.createElement('td');
        
        if (!category.calculated) {
            const editButton = document.createElement('button');
            editButton.className = 'edit-btn';
            editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
            editButton.addEventListener('click', () => makeValueEditable(valueCell, category.id));
            actionCell.appendChild(editButton);
        } else {
            actionCell.textContent = '(Calculated)';
        }
        
        // Append cells to row
        row.appendChild(nameCell);
        row.appendChild(valueCell);
        row.appendChild(actionCell);
        
        tbody.appendChild(row);
    });
}

// Render all charts
function renderCharts() {
    if (!currentData) return;
    
    // Assets distribution chart
    renderAssetsDistributionChart();
    
    // Guild silver distribution chart
    renderSilverDistributionChart();
    
    // Liquid assets by location chart
    renderLiquidAssetsByLocationChart();
    
    // Illiquid assets by location chart
    renderIlliquidAssetsByLocationChart();
    
    // Membership chart
    renderMembershipChart();
    
    // Active members chart
    renderActiveMembersChart();
}

// Render assets distribution chart
function renderAssetsDistributionChart() {
    const ctx = document.getElementById('assets-distribution-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.assetsDistribution) {
        charts.assetsDistribution.destroy();
    }
    
    const data = [
        currentData.total_liquid_assets || 0,
        currentData.total_illiquid_assets || 0
    ];
    
    charts.assetsDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Liquid Assets', 'Illiquid Assets'],
            datasets: [{
                data: data,
                backgroundColor: ['#3498db', '#e74c3c'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${formatNumber(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Render silver distribution chart
function renderSilverDistributionChart() {
    const ctx = document.getElementById('silver-distribution-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.silverDistribution) {
        charts.silverDistribution.destroy();
    }
    
    const data = [
        currentData.ocular_silver || 0,
        currentData.university_silver || 0,
        currentData.vanguard_silver || 0
    ];
    
    charts.silverDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['OCULAR', 'OCULAR University', 'OCULAR Vanguard'],
            datasets: [{
                data: data,
                backgroundColor: ['#3498db', '#2ecc71', '#9b59b6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${formatNumber(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Render liquid assets by location chart
function renderLiquidAssetsByLocationChart() {
    const ctx = document.getElementById('liquid-assets-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.liquidAssets) {
        charts.liquidAssets.destroy();
    }
    
    // Get sellable items by location
    const locations = [
        {name: 'SIV HO', value: currentData.sellable_siv_ho || 0},
        {name: 'Delta HQ', value: currentData.sellable_delta_hq || 0},
        {name: 'Coast HQ', value: currentData.sellable_coast_hq || 0},
        {name: 'Martlock', value: currentData.sellable_martlock || 0},
        {name: 'Thetford', value: currentData.sellable_thetford || 0},
        {name: 'Lymhurst', value: currentData.sellable_lymhurst || 0},
        {name: 'Bridgewatch', value: currentData.sellable_bridgewatch || 0},
        {name: 'Fort Sterling', value: currentData.sellable_fort_sterling || 0},
        {name: 'Brecilien', value: currentData.sellable_brecilien || 0},
        {name: 'Caerleon', value: currentData.sellable_caerleon || 0}
    ];
    
    // Sort by value, descending
    locations.sort((a, b) => b.value - a.value);
    
    charts.liquidAssets = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: locations.map(loc => loc.name),
            datasets: [{
                label: 'Sellable Items Value',
                data: locations.map(loc => loc.value),
                backgroundColor: '#3498db',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatNumber(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return (value / 1000).toFixed(1) + 'K';
                            }
                            return value;
                        }
                    }
                }
            }
        }
    });
}

// Render illiquid assets by location chart
function renderIlliquidAssetsByLocationChart() {
    const ctx = document.getElementById('illiquid-assets-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.illiquidAssets) {
        charts.illiquidAssets.destroy();
    }
    
    // Get illiquid assets by location
    const locations = [
        {name: 'SIV HO', value: currentData.illiquid_siv_ho || 0},
        {name: 'Delta HQ', value: currentData.illiquid_delta_hq || 0},
        {name: 'Coast HQ', value: currentData.illiquid_coast_hq || 0},
        {name: 'Martlock', value: currentData.illiquid_martlock || 0},
        {name: 'Thetford', value: currentData.illiquid_thetford || 0},
        {name: 'Lymhurst', value: currentData.illiquid_lymhurst || 0},
        {name: 'Bridgewatch', value: currentData.illiquid_bridgewatch || 0},
        {name: 'Fort Sterling', value: currentData.illiquid_fort_sterling || 0},
        {name: 'Brecilien', value: currentData.illiquid_brecilien || 0},
        {name: 'Caerleon', value: currentData.illiquid_caerleon || 0}
    ];
    
    // Sort by value, descending
    locations.sort((a, b) => b.value - a.value);
    
    charts.illiquidAssets = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: locations.map(loc => loc.name),
            datasets: [{
                label: 'Illiquid Assets Value',
                data: locations.map(loc => loc.value),
                backgroundColor: '#e74c3c',
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return formatNumber(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) {
                                return (value / 1000000).toFixed(1) + 'M';
                            } else if (value >= 1000) {
                                return (value / 1000).toFixed(1) + 'K';
                            }
                            return value;
                        }
                    }
                }
            }
        }
    });
}

// Render membership distribution chart
function renderMembershipChart() {
    const ctx = document.getElementById('membership-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.membership) {
        charts.membership.destroy();
    }
    
    const data = [
        currentData.ocular_members || 0,
        currentData.university_members || 0,
        currentData.vanguard_members || 0
    ];
    
    charts.membership = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['OCULAR', 'OCULAR University', 'OCULAR Vanguard'],
            datasets: [{
                data: data,
                backgroundColor: ['#3498db', '#2ecc71', '#9b59b6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const total = data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                            return `${value} members (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Render active members chart
function renderActiveMembersChart() {
    const ctx = document.getElementById('active-members-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (charts.activeMembers) {
        charts.activeMembers.destroy();
    }
    
    // Calculate active/inactive members by guild
    const data = [
        {
            guild: 'OCULAR',
            active: currentData.ocular_active_members || 0,
            inactive: (currentData.ocular_members || 0) - (currentData.ocular_active_members || 0)
        },
        {
            guild: 'OCULAR University',
            active: currentData.university_active_members || 0,
            inactive: (currentData.university_members || 0) - (currentData.university_active_members || 0)
        },
        {
            guild: 'OCULAR Vanguard',
            active: currentData.vanguard_active_members || 0,
            inactive: (currentData.vanguard_members || 0) - (currentData.vanguard_active_members || 0)
        }
    ];
    
    charts.activeMembers = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.guild),
            datasets: [
                {
                    label: 'Active',
                    data: data.map(item => item.active),
                    backgroundColor: '#2ecc71',
                    borderWidth: 0
                },
                {
                    label: 'Inactive',
                    data: data.map(item => item.inactive),
                    backgroundColor: '#95a5a6',
                    borderWidth: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}
