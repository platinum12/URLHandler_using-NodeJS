package client;

import java.util.Arrays;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TestResults {
	private TestResult[] results;

	public TestResult[] getResults() {
		return results;
	}

	public void setResults(TestResult[] results) {
		this.results = results;
	}

	@Override
	public String toString() {
		return "TestResults [results=" + Arrays.toString(results) + "]";
	}

	
}
