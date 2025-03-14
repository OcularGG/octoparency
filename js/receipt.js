/**
 * Generate a restaurant-style receipt as an image
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
    
    // Format the receipt in a restaurant receipt style
    let receiptContent = `
DOUBLE OVERCHARGE
Death Receipt
-----------------------------
Date: ${dateStr}
Time: ${timeStr}
Receipt #: ${battle.EventId.substring(0, 6)}
-----------------------------

VICTIM INFO:
${victim.Name}
Guild: ${victim.GuildName || 'None'}
Item Power: ${Math.round(victim.AverageItemPower || 0)}

KILLER:
${killer.Name}
Guild: ${killer.GuildName || 'None'}
Alliance: ${killer.AllianceName || 'None'}

-----------------------------
ITEMS LOST:
`;

    // Add victim's equipment as line items
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
        
        equipment.forEach(slot => {
            if (slot.item) {
                const itemName = slot.item.Type ? slot.item.Type.split('_').pop() : 'Unknown';
                const tier = slot.item.Quality || '?';
                receiptContent += `${slot.name.padEnd(10)} T${tier} ${itemName}\n`;
            }
        });
    } else {
        receiptContent += "No items recorded\n";
    }
    
    // Add participants as "service charge"
    if (participants && participants.length > 0) {
        receiptContent += "\nKILLING PARTY:\n";
        participants.slice(0, 5).forEach(participant => {
            receiptContent += `${participant.Name} (Dmg: ${Math.round(participant.DamageDone || 0)})\n`;
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

    // Generate image from text
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const lineHeight = 20;
    const font = '14px "Courier New", monospace';
    ctx.font = font;
    
    // Measure text for canvas size
    const lines = receiptContent.split('\n');
    const padding = 40;
    const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width)) + padding;
    
    canvas.width = maxWidth;
    canvas.height = (lines.length * lineHeight) + padding;
    
    // Fill background (white for receipt look)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw text in black
    ctx.font = font;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    lines.forEach((line, index) => {
        ctx.fillText(line, padding/2, (padding/2) + (index * lineHeight));
    });
    
    // Convert canvas to data URL
    const imgData = canvas.toDataURL('image/png');
    
    // Return as HTML
    return `
        <img src="${imgData}" alt="Death Receipt for ${victim.Name}" class="receipt-img">
        <p class="receipt-caption">Death Receipt for ${victim.Name} - ${dateStr}</p>
    `;
}

async function generateReceipt(death) {
    // Basic receipt generation logic
    const receiptContent = `
        <h3>Death Receipt</h3>
        <p>Victim: ${death.Victim.Name}</p>
        <p>Killer: ${death.Killer.Name}</p>
        <p>Time: ${new Date(death.TimeStamp).toLocaleString()}</p>
        <p>Total Fame: ${death.TotalVictimKillFame}</p>
    `;
    return receiptContent;
}

window.generateReceipt = generateReceipt;
