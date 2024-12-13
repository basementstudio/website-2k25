import { Container, Text } from "@react-three/uikit";
import { Dispatch, SetStateAction, useState } from "react";
import { LabData } from "../screen-ui";

export const LabList = ({ selectedLab, setSelectedLab, data }: { selectedLab: number, setSelectedLab: Dispatch<SetStateAction<number>>, data: LabData[] }) => {
    const [selectedContributor, setSelectedContributor] = useState<number | null>(null);
    return (
        <Container display={"flex"} flexDirection={"column"} width={"100%"}>
            {
                data.map(({ title, contributors, link }, idx) => (
                    <Container paddingX={8} paddingY={4} borderBottomWidth={idx === data.length - 1 ? 0 : 2} height={40} borderColor={"orange"} backgroundColor={selectedLab === idx ? "orange" : "#000"} key={idx} onClick={() => {
                        window.open(link, '_blank');
                    }} onPointerOver={() => setSelectedLab(idx)}>
                        <Text fontSize={14} fontWeight={"bold"} color={selectedLab === idx ? "#000" : "orange"} width={"40%"}>{title}</Text>
                        <Container display={"flex"} flexDirection={"row"} gap={4}>
                            <Text fontSize={14} fontWeight={"bold"} color={selectedLab === idx ? "#000" : "orange"}>C:</Text>
                            {
                                contributors.map((contributor, cIdx) => (
                                    <Container key={cIdx} positionType={"relative"} onPointerOver={() => setSelectedContributor(cIdx)} onPointerOut={() => setSelectedContributor(null)}>
                                        <Text fontSize={14} fontWeight={"bold"} color={selectedLab === idx ? "#000" : "orange"} onClick={() => {
                                            window.open(`https://github.com${contributor}`)
                                        }}>{contributor}</Text>
                                        {selectedContributor === cIdx && (
                                            <Container positionType={"absolute"} width={"100%"} height={2} positionBottom={5} backgroundColor={"#000"} />
                                        )}
                                    </Container>
                                ))
                            }
                        </Container>
                    </Container>
                ))
            }
        </Container>
    )
}
