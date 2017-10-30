package client;

import java.util.Arrays;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Sites {

	private String[] sitesToTest;
	private String iterations;
	public String[] getSitesToTest() {
		return sitesToTest;
	}
	public void setSitesToTest(String[] sitesToTest) {
		this.sitesToTest = sitesToTest;
	}
	public String getIterations() {
		return iterations;
	}
	public void setIterations(String iterations) {
		this.iterations = iterations;
	}
	@Override
	public String toString() {
		return "Sites [sitesToTest=" + Arrays.toString(sitesToTest) + ", iterations=" + iterations + "]";
	}
}
