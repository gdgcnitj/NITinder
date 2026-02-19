import ActionButtons from "./modules/functional/Swipe/ActionButtons"
import SwipeProfiles from "./modules/functional/Swipe/SwipeProfiles"
import PageLayout from "./modules/layout/PageLayout"

export default function Home() {
  return (
    <PageLayout>
      <SwipeProfiles ActionButtons={ActionButtons}/>
    </PageLayout>
  )
}