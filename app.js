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

// Event listeners
refreshButton.addEventListener('click', initDashboard);

loginButton.addEventListener('click', showLoginModal);

logoutButton.addEventListener('click', function() {
    setAdminMode(false);
});

closeModalButton.addEventListener('click', hideLoginModal);

// Close modal when clicking outside the content
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
