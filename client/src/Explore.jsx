import ProfileCard from "./children/modules/functional/Explore/ProfileCard";
import ViewAllProfiles from "./children/modules/functional/Explore/ViewAllProfiles";
import Heading from "./children/modules/layout/Heading";
import PageLayout from "./children/modules/layout/PageLayout";

export default function Explore() {
  return (
    <PageLayout>
      <Heading>Explore</Heading>
      <ViewAllProfiles ProfileCard={ProfileCard} />
    </PageLayout>
  )
}