import ActionButtons from "./children/modules/functional/Swipe/ActionButtons"
import SwipeProfiles from "./children/modules/functional/Swipe/SwipeProfiles"
import PageLayout from "./children/modules/layout/PageLayout"

export default function Home() {
  return (
    <PageLayout>
      <SwipeProfiles ActionButtons={ActionButtons}/>
    </PageLayout>
  )
}