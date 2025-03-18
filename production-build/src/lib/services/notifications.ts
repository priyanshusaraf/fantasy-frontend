import { sendEmail } from '@/lib/email';

interface WinnerNotificationParams {
  userId: number;
  userName: string;
  contestName: string;
  teamName: string;
  rank: number;
  prizeAmount: number;
  netAmount: number;
  tournamentName: string;
}

/**
 * Notify a user that they won a prize
 */
export async function notifyWinner(params: WinnerNotificationParams) {
  const { 
    userId,
    userName,
    contestName,
    teamName,
    rank,
    prizeAmount,
    netAmount,
    tournamentName
  } = params;

  try {
    // Get user's email from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, pushNotificationToken: true, phone: true }
    });

    if (!user) {
      console.warn(`User ${userId} not found for winner notification`);
      return;
    }

    // Log the prize win for auditing
    console.log(`Prize notification: User ${userId} (${userName}) won ${getOrdinal(rank)} place in ${contestName} and received ₹${netAmount.toFixed(2)}`);

    // Format email subject and message
    const emailSubject = `Congratulations! You won ${getOrdinal(rank)} prize in ${contestName}`;
    
    const emailMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Congratulations, ${userName}!</h2>
        <p>Your team <strong>${teamName}</strong> secured ${getOrdinal(rank)} place in the ${contestName} for ${tournamentName}.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Prize Amount:</strong> ₹${prizeAmount.toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Processing Fee:</strong> ₹${(prizeAmount - netAmount).toFixed(2)}</p>
          <p style="margin: 5px 0; font-size: 1.2em;"><strong>Net Amount:</strong> ₹${netAmount.toFixed(2)}</p>
        </div>
        
        <p>The prize amount will be credited to your registered bank account within 2-3 business days.</p>
        
        <p>If you haven't added your bank account details yet, please add them in your profile settings to receive your prize.</p>
        
        <p>Thank you for participating in our fantasy sports contest!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.8em; color: #666;">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `;

    // Send email notification if email is available
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: emailSubject,
        html: emailMessage
      });
    }

    // Send push notification if token is available
    if (user.pushNotificationToken) {
      await sendPushNotification({
        token: user.pushNotificationToken,
        title: 'Prize Won! 🏆',
        body: `Congratulations! Your team ${teamName} won ${getOrdinal(rank)} place and ₹${netAmount.toFixed(0)}.`,
        data: {
          type: 'PRIZE_WIN',
          contestId: contestName,
          rank,
          amount: netAmount
        }
      });
    }

    // Send SMS if phone number is available
    if (user.phone) {
      await sendSMS({
        phone: user.phone,
        message: `Congratulations! Your team ${teamName} won ${getOrdinal(rank)} place in ${contestName} and ₹${netAmount.toFixed(0)} will be credited to your bank account.`
      });
    }

    return true;
  } catch (error) {
    console.error('Error sending winner notification:', error);
    return false;
  }
}

/**
 * Send a push notification
 */
async function sendPushNotification({ token, title, body, data }: any) {
  // This is a placeholder - implement with your push notification service
  console.log(`[PUSH NOTIFICATION] to ${token}: ${title} - ${body}`);
  return true;
}

/**
 * Send an SMS
 */
async function sendSMS({ phone, message }: { phone: string, message: string }) {
  // This is a placeholder - implement with your SMS service
  console.log(`[SMS] to ${phone}: ${message}`);
  return true;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
} 