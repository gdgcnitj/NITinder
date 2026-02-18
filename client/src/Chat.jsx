import MatchCard from "./modules/functional/Matches/MatchCard";
import ViewAllMatches from "./modules/functional/Matches/ViewAllMatches";
import Heading from "./modules/layout/Heading";
import PageLayout from "./modules/layout/PageLayout";

export default function Chat() {
  return (
    <PageLayout>
      <Heading>Your Matches</Heading>
      <ViewAllMatches MatchCard={MatchCard}/>
    </PageLayout>
  )
}