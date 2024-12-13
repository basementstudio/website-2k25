import { Container, Text } from "@react-three/uikit";
import { Dispatch, SetStateAction } from "react";
import { LabData } from "../screen-ui";

export const LabList = ({ selectedLab, setSelectedLab, data }: { selectedLab: number, setSelectedLab: Dispatch<SetStateAction<number>>, data: LabData[] }) => {
    return (
        <Container display={"flex"} flexDirection={"column"} width={"100%"}>
            {
                data.map(({ title, contributors }, idx) => (
                    <Container paddingX={8} paddingY={4} borderBottomWidth={2} height={40} borderColor={"orange"} backgroundColor={selectedLab === idx ? "orange" : "#000"} key={idx} onPointerOver={() => setSelectedLab(idx)}>
                        <Text fontSize={14} fontWeight={"bold"} color={selectedLab === idx ? "#000" : "orange"} width={"40%"}>{title}</Text>
                        <Container display={"flex"} flexDirection={"row"} gap={4}>
                            <Text fontSize={14} fontWeight={"bold"} color={selectedLab === idx ? "#000" : "orange"}>C:</Text>
                            <Text fontSize={14} fontWeight={"bold"} color={selectedLab === idx ? "#000" : "orange"}>{contributors.join(" ")}</Text>
                        </Container>
                    </Container>
                ))
            }
        </Container>
    )
}
