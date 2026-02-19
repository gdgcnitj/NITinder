import MatchCard from "./modules/functional/Matches/MatchCard";
import ViewAllMatches from "./modules/functional/Matches/ViewAllMatches";
import NewMatchesCard from "./modules/functional/Matches/NewMatchesCard";
import MessageListItem from "./modules/functional/Matches/MessageListItem";
import ChatHeader from "./modules/functional/Matches/ChatHeader";
import MessageBubble from "./modules/functional/Matches/MessageBubble";
import MessageInput from "./modules/functional/Matches/MessageInput";
import PageLayout from "./modules/layout/PageLayout";

export default function Chat() {
  return (
    <PageLayout>
      <ViewAllMatches 
        MatchCard={MatchCard}
        NewMatchesCard={NewMatchesCard}
        MessageListItem={MessageListItem}
        ChatHeader={ChatHeader}
        MessageBubble={MessageBubble}
        MessageInput={MessageInput}
      />
    </PageLayout>
  )
}