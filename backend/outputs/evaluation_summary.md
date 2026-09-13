# PharmaLens RAG Evaluation Summary

**Overall System Score**: 89.0%

## Performance Metrics Breakdown

| Metric | Score | Status |
| :--- | :---: | :---: |
| **Correctness** | 1.00 | PASS |
| **Grounding** | 0.69 | WARN |
| **Citation Accuracy** | 1.00 | PASS |

## Evaluation Details

- **Total Test Cases**: 6
- **Failed Cases**: 1

### Benchmark Questions Breakdown

#### Question 1: What did Study 001 evaluate?
- **Status**: `PASS`
- **Correctness**: `1.00` | **Grounding**: `1.00` | **Citation Accuracy**: `1.00`
- **Answer Preview**: Study 001 evaluated the safety and efficacy of Drug X in adult patients with moderate disease [1].

#### Question 2: What was the primary endpoint of Study 001?
- **Status**: `PASS`
- **Correctness**: `1.00` | **Grounding**: `1.00` | **Citation Accuracy**: `1.00`
- **Answer Preview**: The primary endpoint of Study 001 was the change in disease severity from baseline after twelve weeks of treatment [1].

#### Question 3: What was the most common adverse event in Study 001?
- **Status**: `PASS`
- **Correctness**: `1.00` | **Grounding**: `0.71` | **Citation Accuracy**: `1.00`
- **Answer Preview**: Based on the provided research context, the most common treatment-emergent adverse event in Study 001 was transient headache, which was reported in 8.5% of patients receiving Drug X compared to 3.2% in the placebo group [1].

#### Question 4: What are the contraindications for Drug X?
- **Status**: `PASS`
- **Correctness**: `1.00` | **Grounding**: `0.73` | **Citation Accuracy**: `1.00`
- **Answer Preview**: Based on the provided research context, Drug X is contraindicated in:

* Patients with severe hepatic impairment [1].
* Patients with known hypersensitivity to its active ingredients [1].

#### Question 5: What are the inclusion criteria for Study 002?
- **Status**: `PASS`
- **Correctness**: `1.00` | **Grounding**: `0.71` | **Citation Accuracy**: `1.00`
- **Answer Preview**: Based on the provided research context, the inclusion criteria for Study 002 are:

* Patients aged 18 to 65 years
* Documented refractory disease severity greater than or equal to 4 (>= 4) [1]

#### Question 6: What is the recommended dosage of Drug Z for pediatric cancer?
- **Status**: `FAIL`
- **Correctness**: `1.00` | **Grounding**: `0.00` | **Citation Accuracy**: `1.00`
- **Answer Preview**: I don't have enough information in the available documents to answer that question.
