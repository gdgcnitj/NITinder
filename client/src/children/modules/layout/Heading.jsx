export default function Heading({children, textAlign="left"}) {
    const styles = {
        text1: {
            fontWeight: 700,
            fontSize: "2rem",
            color: "white",
            textAlign: textAlign,
            width: "100%",
            padding: "15",
        }
    }
    return (
        <p style={styles.text1}>
            {children}
        </p>
    )
}