/**
 * Generate a ASCII-style receipt for a battle
 * @param {Object} battle - Battle data
 * @param {string} type - 'kills' or 'deaths'
 * @returns {string} HTML for the battle receipt
 */
function generateBattleReceipt(battle, type) {
    const eventDate = new Date(battle.TimeStamp);
    const dateStr = eventDate.toLocaleDateString();
    const timeStr = eventDate.toLocaleTimeString();
    
    const killer = battle.Killer;
    const victim = battle.Victim;
    const participants = battle.Participants || [];
    
    // Format header
    let receipt = `<pre class="battle-receipt">
+==============================================+
|              ALBION ONLINE BATTLE            |
|             ${dateStr} ${timeStr}            |
+----------------------------------------------+
| EVENT TYPE: ${type.toUpperCase()}            |
+----------------------------------------------+\n`;

    // Add killer info
    receipt += `| KILLER: ${killer.Name}
| GUILD: ${killer.GuildName || 'None'}
| ALLIANCE: ${killer.AllianceName || 'None'}
| IP: ${Math.round(killer.AverageItemPower || 0)}
+----------------------------------------------+\n`;

    // Add victim info
    receipt += `| VICTIM: ${victim.Name}
| GUILD: ${victim.GuildName || 'None'}
| ALLIANCE: ${victim.AllianceName || 'None'}
| IP: ${Math.round(victim.AverageItemPower || 0)}
+----------------------------------------------+\n`;

    // Add fame info
    receipt += `| TOTAL FAME: ${battle.TotalVictimKillFame.toLocaleString()}
+----------------------------------------------+\n`;

    // Add participants if available
    if (participants.length > 0) {
        receipt += `| PARTICIPANTS:
`;
        participants.slice(0, 5).forEach(participant => {
            receipt += `| - ${participant.Name} (${Math.round(participant.DamageDone || 0)} dmg)
`;
        });
        
        if (participants.length > 5) {
            receipt += `| + ${participants.length - 5} more...
`;
        }
        
        receipt += `+----------------------------------------------+\n`;
    }
    
    // Add inventory if available
    if (victim.Inventory && victim.Inventory.length > 0) {
        receipt += `| EQUIPMENT:
`;
        victim.Equipment = victim.Equipment || {};
        const equipment = [
            { name: "Main Hand", item: victim.Equipment.MainHand },
            { name: "Off Hand", item: victim.Equipment.OffHand },
            { name: "Head", item: victim.Equipment.Head },
            { name: "Armor", item: victim.Equipment.Armor },
            { name: "Shoes", item: victim.Equipment.Shoes },
            { name: "Cape", item: victim.Equipment.Cape }
        ];
        
        equipment.forEach(slot => {
            if (slot.item) {
                const itemName = slot.item.Type.split('_').pop();
                receipt += `| - ${slot.name}: ${itemName} (T${slot.item.Quality})
`;
            }
        });
        
        receipt += `+----------------------------------------------+\n`;
    }
    
    // Close receipt
    receipt += `|          https://battletab.vercel.app          |
+==============================================+
</pre>`;
    
    return receipt;
}
