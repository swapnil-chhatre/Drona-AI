CURRICULUM_SUGGESTIONS: dict[str, dict[str, list[str]]] = {
    "Year 7": {
        "Science": [
            "Investigate the methods used to separate mixtures",
            "Explain the relationship between the Earth, Sun, and Moon",
            "How do scientists classify living organisms?",
            "Design an experiment to test the effects of gravity",
        ],
        "Mathematics": [
            "How do we apply fractions and decimals in real-world budgeting?",
            "Explain the core concepts of introductory algebra",
            "Investigate the properties of different geometric shapes",
            "How to effectively represent and interpret statistical data",
        ],
        "English": [
            "Analyse the narrative structure of a short story",
            "Identify and explain persuasive techniques in media",
            "Research the cultural significance of myths and legends",
            "How does poetic language create meaning and emotion?",
        ],
        "History": [
            "Research how we know about the ancient past",
            "Explain why and where the earliest societies developed",
            "Investigate the defining characteristics of ancient societies",
            "What have been the legacies of ancient societies?",
        ],
        "Geography": [
            "How does reliance on environments influence people's perception?",
            "Explain the causes and impacts of water scarcity",
            "Investigate approaches to improve resource availability",
            "What factors influence the liveability of a place?",
        ],
        "Civics and Citizenship": [
            "Explain how the Constitution shapes Australia's democracy",
            "Research the principles that protect rights in the justice system",
            "Investigate factors that contribute to a cohesive society",
            "Why is the separation of powers important in government?",
        ],
        "Economics and Business": [
            "Explain the relationship between consumers and producers",
            "Why is financial planning important for future success?",
            "Investigate how entrepreneurial behaviour contributes to business",
            "Research the different ways people can derive an income",
        ],
    },
    "Year 8": {
        "Science": [
            "Explain the differences between plant and animal cells",
            "Investigate how energy is transferred and transformed",
            "How does the particle model explain states of matter?",
            "Research the processes involved in the rock cycle",
        ],
        "Mathematics": [
            "How to solve linear equations with multiple variables",
            "Explain the real-world applications of rates and ratios",
            "Investigate the proof and uses of Pythagoras' Theorem",
            "Calculate the theoretical and experimental probability of events",
        ],
        "English": [
            "Analyse how media texts construct representations of youth",
            "Explain the conventions of different fiction genres",
            "How does visual literacy enhance our understanding of texts?",
            "Research the historical context of a classic literature piece",
        ],
        "History": [
            "Explain how societies changed from the ancient to modern world",
            "Research the causes and effects of contact between societies",
            "Investigate the way of life in Medieval Europe",
            "How did significant ideas from this period influence today?",
        ],
        "Geography": [
            "Explain how environmental processes affect landscape characteristics",
            "Investigate the causes and consequences of urbanisation",
            "How do interconnections between places affect people's lives?",
            "Research the consequences of changes to environments",
        ],
        "Civics and Citizenship": [
            "Explain the freedoms and responsibilities of citizens",
            "Research how laws are made and applied in Australia",
            "Investigate different perspectives about national identity",
            "Why is active participation important in a democracy?",
        ],
        "Economics and Business": [
            "Explain why markets are needed and why governments intervene",
            "Investigate the rights and responsibilities of consumers",
            "Research factors that might affect the way people work in the future",
            "How do businesses respond to new opportunities in the market?",
        ],
    },
    "Year 9": {
        "Science": [
            "Investigate how human body systems work together",
            "Explain the flow of energy and matter through ecosystems",
            "How do we balance chemical equations?",
            "Research the evidence supporting the theory of plate tectonics",
        ],
        "Mathematics": [
            "How to graph and interpret non-linear relationships",
            "Explain the applications of trigonometry in finding unknown sides",
            "Calculate the surface area and volume of composite solids",
            "Investigate methods for collecting and analysing statistical data",
        ],
        "English": [
            "Analyse the themes and character development in a Shakespearean play",
            "Explain how dystopian fiction reflects societal anxieties",
            "Investigate the use of rhetorical devices in historical speeches",
            "How to write a comprehensive literary critique",
        ],
        "History": [
            "Research the changing features of the movements of people",
            "Explain how technological developments contributed to change",
            "Investigate the significance and long-term impact of imperialism",
            "What was the significance and impact of World War I?",
        ],
        "Geography": [
            "Explain the causes and consequences of change in biomes",
            "Research the environmental challenges of food production",
            "Why are interconnections important for the future of places?",
            "Investigate the effects of production and consumption on environments",
        ],
        "Civics and Citizenship": [
            "Investigate the influences that shape Australia's political system",
            "Explain how Australia's court system supports a just society",
            "How do citizens participate effectively in an interconnected world?",
            "Research the role of political parties in forming governments",
        ],
        "Economics and Business": [
            "Explain how participants in the global economy interact",
            "Investigate strategies to manage financial risks and rewards",
            "How does creating a competitive advantage benefit a business?",
            "Research the responsibilities of participants in the workplace",
        ],
    },
    "Year 10": {
        "Science": [
            "Explain the role of DNA and genetics in inheritance",
            "Investigate the mechanisms that drive the theory of evolution",
            "How do we apply the laws of motion to everyday scenarios?",
            "Research the impact of human activity on global systems",
        ],
        "Mathematics": [
            "How to solve quadratic equations using various methods",
            "Investigate advanced trigonometric functions and their graphs",
            "Explain how to analyse and interpret bivariate data",
            "Calculate problems involving exponential functions and logarithms",
        ],
        "English": [
            "How to structure a comparative essay on two distinct texts",
            "Investigate the enduring relevance of classic literature",
            "Explain how satire and parody are used for social commentary",
            "Analyse the representation of Australian voices in modern poetry",
        ],
        "History": [
            "Explain how the nature of global conflict changed in the 20th century",
            "Research the consequences of World War II on the modern world",
            "How was Australian society affected by significant global events?",
            "Investigate the struggles for human rights and freedoms",
        ],
        "Geography": [
            "Explain the spatial variation between places and environments",
            "Investigate management options for sustaining natural systems",
            "How do world views influence decisions on environmental change?",
            "Research the causes of global differences in human wellbeing",
        ],
        "Civics and Citizenship": [
            "Explain how Australia's democracy is shaped by the global context",
            "How are government policies shaped by international legal obligations?",
            "Investigate the features and practices of a resilient democracy",
            "Research the purpose and work of the High Court of Australia",
        ],
        "Economics and Business": [
            "Explain how the performance of an economy is measured",
            "Why do variations in economic performance and living standards exist?",
            "Investigate strategies governments use to manage economic performance",
            "How do businesses respond to changing economic conditions?",
        ],
    },
}

GRADES = list(CURRICULUM_SUGGESTIONS.keys())
SUBJECTS = list(next(iter(CURRICULUM_SUGGESTIONS.values())).keys())
