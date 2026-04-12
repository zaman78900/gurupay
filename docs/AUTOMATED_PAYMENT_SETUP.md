# 🤖 Automated Payment Setup - Complete Guide

## Overview
GuruPay now includes intelligent automated payment setup when you add new students to a batch. This feature automatically:
- Sets payment due dates
- Schedules WhatsApp payment reminders
- Applies consistent policies across all students

## ✨ What Gets Automated

### 1. **Automatic Due Date Setting**
When a new student is added to a batch, a due date is automatically calculated based on your preferred preset:

- **End of Month** (Default): Due date is set to the last day of the current month
- **Days from Now**: Due date is X days from the student's joining date (default: 7 days)
- **Next Month**: Due date is on the same day of the next month

### 2. **Automatic WhatsApp Reminders**
Payment reminders are automatically scheduled and will be sent via WhatsApp on:
- 1 day BEFORE the due date
- ON the due date (reminder notice)
- Optional: After the due date (if configured)

These reminders are automatically paired with the due date—no manual scheduling needed!

## 🎯 How It Works

### When You Add a Student:
1. Fill in student details (name, phone, batch, etc.)
2. Click "Add Student"
3. **Automatically:**
   - A payment record is created for the current month
   - Due date is calculated (end of month by default)
   - Payment reminders are scheduled (1 day before + on due date)
   - Student is immediately ready for fee tracking

### Real-World Flow:
```
Add Student "Aarav Sharma" to Batch "Morning Yoga"
↓
Payment auto-created for current month
↓
Due date: End of this month (e.g., Jan 31, 2024)
↓
Reminders queued:
  • Jan 30 @ 10:00 AM: "Payment due tomorrow"
  • Jan 31 @ 10:00 AM: "Payment due today"
↓
Done! No additional configuration needed
```

## ⚙️ Configuration Options

### Current Settings (Can Be Customized):
- **Due Date Preset**: `endOfMonth` (other options: `daysFromNow`, `nextMonth`)
- **Days for Due Date**: `7` (used if preset is `daysFromNow`)
- **Auto Reminders**: `true` (enabled by default)
- **Reminder Timings**:
  - 1 day before due date ✓
  - On due date ✓
  - After due date (optional)

### Future Customization:
You'll soon be able to configure these settings per batch or globally through:
- Settings panel
- Batch configuration
- Per-student overrides

## 📱 Integration with WhatsApp

Scheduled reminders automatically integrate with your WhatsApp integration:
- Messages are queued in your reminder system
- Sent via WhatsApp at the scheduled time
- Include student name, amount, due date
- Include payment link/instructions

## 🔧 Technical Details

### Files Modified:
- `src/utils/autoPaymentSetup.js` - Core automation logic
- `src/utils/autoPaymentConfig.js` - Configuration management
- `src/App.jsx` - Integration in student creation flow

### Key Functions:
```javascript
// Calculate automatic due date
calculateAutoDueDate(presetType, days)

// Create default reminder config
createDefaultReminders(dueDate)

// Apply complete setup to payment
applyAutoPaymentSetup(payment, options)
```

## 🎨 UI Improvements

### Modal Enhancements:
Both Set Due Date and Schedule Reminders modals now feature:
- ✅ Professional gradient headers
- ✅ Dark/Light mode compatibility
- ✅ Improved visual hierarchy
- ✅ Better touch targets and accessibility
- ✅ Enhanced feedback and status indicators
- ✅ Informative tooltips and guidance

### Dark Mode Support:
All colors are CSS variables that adapt to:
- Light mode: Clean, professional appearance
- Dark mode: Reduced eye strain, professional look

## 🚀 Benefits

1. **Time Saving**: No need to manually set due dates for each student
2. **Consistency**: All students in a batch get the same payment terms
3. **Automation**: Reminders work automatically—no need to remember
4. **Better Collection Rate**: Timely reminders improve on-time payments
5. **Professional**: Looks polished and well-organized
6. **Error Prevention**: Eliminates manual date entry mistakes

## 📋 Usage Examples

### Example 1: Yoga Class
```
You add "Priya Gupta" to "Morning Yoga Batch"
↓
Payment: ₹1,500 (with GST)
Due Date: Jan 31, 2024 (end of current month)
Reminders: Automatically scheduled
Status: Ready for fee tracking
```

### Example 2: Programming Course
```
You add "Arjun Singh" to "Python Basics Batch"
↓
Payment: ₹3,000 (with GST)
Due Date: Jan 31, 2024 (end of current month)
Reminders: Automatically scheduled
Status: Ready for fee tracking
```

## ⚡ Quick Tips

1. **Edit Before Saving?** If you need a different due date, you can still manually change it in the Fees section
2. **Check Reminders?** Open Fee section → click on unpaid payment → click 🔔 to view/edit reminders
3. **Change Default?** Coming soon in Settings (currently set to end-of-month for all)
4. **Batch Override?** Create batches with different settings (future feature)

## 🐛 Troubleshooting

### Reminders Not Scheduled?
- Check if due date is set (required for reminders)
- Verify student phone number is valid
- Check WhatsApp integration status

### Wrong Due Date?
- You can edit: Fee → click payment → click 📅 to change
- Changing the date will also update reminders if edited again

### Need Different Schedule?
- Coming soon: Batch-level and global configuration options
- For now: Set manually per payment in Fees section

## 🔮 Upcoming Features

- [ ] Customizable due date presets per batch
- [ ] Global default configuration
- [ ] Reminder time customization
- [ ] Bulk student import with auto-setup
- [ ] Template-based payment terms
- [ ] Email reminders (in addition to WhatsApp)
- [ ] SMS reminders
- [ ] Custom reminder messages

## 📞 Support

If you encounter any issues:
1. Check the Troubleshooting section above
2. Verify student phone numbers are correct
3. Ensure WhatsApp integration is active
4. Contact support with screenshot of the issue

---

**Version**: 1.0  
**Last Updated**: April 2026  
**Status**: ✅ Production Ready
