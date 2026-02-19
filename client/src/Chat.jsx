import MatchCard from "./children/modules/functional/Matches/MatchCard";
import ViewAllMatches from "./children/modules/functional/Matches/ViewAllMatches";
import NewMatchesCard from "./children/modules/functional/Matches/NewMatchesCard";
import MessageListItem from "./children/modules/functional/Matches/MessageListItem";
import ChatHeader from "./children/modules/functional/Matches/ChatHeader";
import MessageBubble from "./children/modules/functional/Matches/MessageBubble";
import MessageInput from "./children/modules/functional/Matches/MessageInput";
import PageLayout from "./children/modules/layout/PageLayout";

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