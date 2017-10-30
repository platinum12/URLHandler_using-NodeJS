package client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TestResult {
	private String site;
	private int avg;
	private int max;
	private int min;
	private String startTestTime;
	private String endTestTime;
	private int iterations;
	public String getSite() {
		return site;
	}
	public void setSite(String site) {
		this.site = site;
	}
	public int getAvg() {
		return avg;
	}
	public void setAvg(int avg) {
		this.avg = avg;
	}
	public int getMax() {
		return max;
	}
	public void setMax(int max) {
		this.max = max;
	}
	public int getMin() {
		return min;
	}
	public void setMin(int min) {
		this.min = min;
	}
	public String getStartTestTime() {
		return startTestTime;
	}
	public void setStartTestTime(String startTestTime) {
		this.startTestTime = startTestTime;
	}
	public String getEndTestTime() {
		return endTestTime;
	}
	public void setEndTestTime(String endTestTime) {
		this.endTestTime = endTestTime;
	}
	public int getIterations() {
		return iterations;
	}
	public void setIterations(int iterations) {
		this.iterations = iterations;
	}
	@Override
	public String toString() {
		return "TestResult [site=" + site + ", avg=" + avg + ", max=" + max + ", min=" + min + ", startTestTime="
				+ startTestTime + ", endTestTime=" + endTestTime + ", iterations=" + iterations + "]";
	}
}
