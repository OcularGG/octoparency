/**
 * Generate a modern receipt as an image
 * @param {Object} battle - Battle data
 * @param {string} type - 'kills' or 'deaths'
 * @returns {string} - HTML with image data
 */
async function generateBattleReceipt(battle, type) {
    const eventDate = new Date(battle.TimeStamp);
    const dateStr = eventDate.toLocaleDateString();
    const timeStr = eventDate.toLocaleTimeString();
    
    const killer = battle.Killer;
    const victim = battle.Victim;
    const participants = battle.Participants || [];
    
    // Format the receipt in a minimalist receipt style
    let receiptContent = `
DOUBLE OVERCHARGE
Death Receipt
-----------------------------
Date: ${dateStr}
Time: ${timeStr}
Receipt #: ${battle.EventId ? battle.EventId.substring(0, 6) : 'N/A'}
Location: ${battle.Location || 'Unknown'}
-----------------------------

VICTIM INFO:
${victim.Name}
Guild: ${victim.GuildName || 'None'}
Item Power: ${Math.round(victim.AverageItemPower || 0)}
Fame Value: ${battle.TotalVictimKillFame.toLocaleString()}

KILLER:
${killer.Name}
Guild: ${killer.GuildName || 'None'}
Alliance: ${killer.AllianceName || 'None'}

-----------------------------
ITEMS LOST:
`;

    // Add victim's equipment as line items with more detail
    if (victim.Equipment) {
        const equipment = [
            { name: "Mainhand", item: victim.Equipment.MainHand },
            { name: "Offhand", item: victim.Equipment.OffHand },
            { name: "Head", item: victim.Equipment.Head },
            { name: "Chest", item: victim.Equipment.Armor },
            { name: "Shoes", item: victim.Equipment.Shoes },
            { name: "Cape", item: victim.Equipment.Cape },
            { name: "Mount", item: victim.Equipment.Mount }
        ];
        
        let totalEstimatedValue = 0;
        let itemCount = 0;
        
        for (const slot of equipment) {
            if (slot.item && slot.item.Type) {
                itemCount++;
                const itemInfo = await window.getItemInfo(slot.item.Type);
                let itemName = 'Unknown Item';
                
                // Try different methods to get a readable item name
                if (itemInfo && itemInfo.Name) {
                    itemName = itemInfo.Name;
                } else if (slot.item.Type) {
                    // Extract readable name from the Type string
                    const parts = slot.item.Type.split('_');
                    if (parts.length > 2) {
                        // Get last part and convert to title case
                        const rawName = parts[parts.length - 1];
                        itemName = rawName.charAt(0) + rawName.slice(1).toLowerCase();
                        
                        // Try to add the item type before it
                        if (parts.length > 3) {
                            const itemType = parts[parts.length - 2].toLowerCase();
                            if (!rawName.toLowerCase().includes(itemType)) {
                                itemName = itemType + ' ' + itemName;
                            }
                        }
                    }
                }
                
                // Get tier as number (e.g., T4, T8)
                let tier = '?';
                if (slot.item.Type && slot.item.Type.charAt(0) === 'T') {
                    tier = slot.item.Type.charAt(1);
                }
                
                // Get quality stars
                const quality = slot.item.Quality || 1;
                let qualityStars = '';
                if (quality > 1) {
                    qualityStars = '.'.repeat(quality - 1);
                }
                
                // Try to estimate value based on tier and quality
                let estimatedValue = 0;
                if (!isNaN(tier)) {
                    const tierNum = parseInt(tier);
                    estimatedValue = Math.pow(2, tierNum) * 1000;
                    if (quality > 1) {
                        estimatedValue *= (1 + (quality - 1) * 0.5);
                    }
                    totalEstimatedValue += estimatedValue;
                }
                
                const valueStr = estimatedValue > 0 ? `~${estimatedValue.toLocaleString()} Silver` : '';
                receiptContent += `${slot.name.padEnd(10)} T${tier}${qualityStars} ${itemName}${valueStr ? ' (' + valueStr + ')' : ''}\n`;
            }
        }
        
        if (itemCount > 0) {
            receiptContent += `\nTotal Est. Value: ~${totalEstimatedValue.toLocaleString()} Silver\n`;
        }
    } else {
        receiptContent += "No items recorded\n";
    }
    
    // Add participants as "service charge"
    if (participants && participants.length > 0) {
        receiptContent += "\nKILLING PARTY:\n";
        
        // Sort participants by damage
        const sortedParticipants = [...participants].sort((a, b) => 
            (b.DamageDone || 0) - (a.DamageDone || 0)
        );
        
        // Calculate total damage
        const totalDamage = sortedParticipants.reduce((sum, p) => sum + (p.DamageDone || 0), 0);
        
        // Show participants with percentage of total damage
        sortedParticipants.slice(0, 5).forEach(participant => {
            const damage = participant.DamageDone || 0;
            const percentage = totalDamage > 0 ? Math.round((damage / totalDamage) * 100) : 0;
            receiptContent += `${participant.Name.padEnd(15)} ${damage.toLocaleString()} dmg (${percentage}%)\n`;
        });
        
        if (participants.length > 5) {
            receiptContent += `+ ${participants.length - 5} more...\n`;
        }
    }
    
    // Add totals section
    receiptContent += `
-----------------------------
SUBTOTAL:      ${battle.TotalVictimKillFame.toLocaleString()} Fame
TAX (0%):      0
-----------------------------
TOTAL:         ${battle.TotalVictimKillFame.toLocaleString()} Fame

THANKS FOR DYING!
PLEASE COME AGAIN

battletab.vercel.app
`;

    // Create a new canvas for the receipt with logo
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const lineHeight = 24; // Increased for dot-matrix look
    const font = '18px "VT323", "Courier New", monospace'; // Using VT323 for receipt look
    ctx.font = font;
    
    // Measure text for canvas size
    const lines = receiptContent.split('\n');
    const padding = 40;
    const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) + padding;
    
    canvas.width = maxWidth;
    canvas.height = (lines.length * lineHeight) + padding + 20; // Extra space for thermal paper effect
    
    // Fill background with off-white to simulate thermal paper
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add subtle texture to simulate thermal paper
    addThermalPaperTexture(ctx, canvas.width, canvas.height);
    
    // Draw text with dot-matrix effect
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    lines.forEach((line, index) => {
        // Use dot-matrix effect for text
        drawDotMatrixText(ctx, line, padding/2, (padding/2) + (index * lineHeight));
    });
    
    // Convert canvas to data URL
    const imgData = canvas.toDataURL('image/png');
    
    // Return as HTML
    return `
        <img src="${imgData}" alt="Death Receipt for ${victim.Name}" class="receipt-img">
    `;
}

/**
 * Add thermal paper texture effect to canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
function addThermalPaperTexture(ctx, width, height) {
    // Add very subtle noise to simulate thermal paper texture
    for (let x = 0; x < width; x += 4) {
        for (let y = 0; y < height; y += 4) {
            if (Math.random() > 0.85) {
                ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.02})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }
    
    // Add a few random "roller marks" that thermal printers sometimes leave
    for (let i = 0; i < 3; i++) {
        const y = Math.random() * height;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        ctx.fillRect(0, y, width, 1);
    }
}

/**
 * Draw text with a dot-matrix printer effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to draw
 * @param {number} x - X position
 * @param {number} y - Y position
 */
function drawDotMatrixText(ctx, text, x, y) {
    // Base character drawing - simulating dot matrix printer
    ctx.fillStyle = '#000';
    
    // For a simple approach, just render the text with slight imperfections
    for (let i = 0; i < text.length; i++) {
        // Slight horizontal variance in character spacing (typical in dot matrix)
        const charX = x + (i * ctx.measureText('M').width * 0.6);
        
        // Slight vertical variance (printer head alignment issues)
        const charY = y + (Math.random() * 0.5 - 0.25);
        
        // Simulate uneven ink distribution
        ctx.globalAlpha = 0.85 + (Math.random() * 0.15);
        
        // Draw the character
        ctx.fillText(text[i], charX, charY);
        
        // Reset alpha
        ctx.globalAlpha = 1.0;
    }
}

// For backward compatibility with existing code
async function generateReceipt(death) {
    return generateBattleReceipt(death, 'deaths');
}

window.generateReceipt = generateReceipt;
window.generateBattleReceipt = generateBattleReceipt;
