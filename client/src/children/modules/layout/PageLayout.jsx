export default function PageLayout({children, justifyContent="center"}) {
    const styles = {
        container: {
            backgroundColor: "#111418",
            overflowX: "auto", 
            minHeight: "100%", width: "100%", 
        },
        subcontainer: {
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: justifyContent,
            maxWidth: "800px", padding: "25px", margin: "auto"
        }
    }

    return (
    <div style={styles.container}>
        <div style={styles.subcontainer}>
            {children}
        </div>
    </div>
    )
}
