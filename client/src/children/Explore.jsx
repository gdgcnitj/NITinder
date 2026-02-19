import ProfileCard from "./modules/functional/Explore/ProfileCard";
import ViewAllProfiles from "./modules/functional/Explore/ViewAllProfiles";
import Heading from "./modules/layout/Heading";
import PageLayout from "./modules/layout/PageLayout";

export default function Explore() {
  return (
    <PageLayout>
      <Heading>Explore</Heading>
      <ViewAllProfiles ProfileCard={ProfileCard} />
    </PageLayout>
  )
}