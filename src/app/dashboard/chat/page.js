import ChatSupport from "@/app/components/ChatSupport";

export default function ChatPage() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <ChatSupport
        senderId="YOUR_USER_ID"    // Replace with current user ID
        receiverId="RECEIVER_ID"   // Replace with other user ID
        receiverName="Alice"
        receiverPic=""             // Add profile image if available
      />
    </div>
  );
}
