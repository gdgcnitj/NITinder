export default function PageLayout({children, justifyContent="center"}) {
    const styles = {
        container: {
            backgroundColor: "#111418",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: justifyContent,
            overflowX: "auto", height: "100%", width: "100%",
        }
    }

    return (
    <div className="bg-[#111418] flex flex-col" style={styles.container}>
        {children}
    </div>
    )
}
