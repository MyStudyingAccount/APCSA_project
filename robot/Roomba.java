package robot;

import kareltherobot.*;

//To make everything look beautiful, and to show how to write it in a elegant way, I have to introduce method earlier than supposed to be. And this is actually a bit different than how you normally do it as we are now trying to extend on the karel J robot module
class BetterBot extends Robot {
	public BetterBot(int street, int avenue, Direction direction, int beepers) {
		super(street, avenue, direction, beepers);
	}
	// all the things upon here basically means (because we are more superior than
	// the robot module, and to fulfill our glorious goal of writing a neat code) we
	// are declaring a extension to the orignal Robot module called BetterBot which
	// contains everything in robot module plus all those following methods that we
	// made

	// to turn right we turn left 3 times
	public void turnRight() {
		turnLeft();
		turnLeft();
		turnLeft();
	}

	// what this does shall be self explanatory
	public int pickAllBeepersAndCount() {
		int beepersCollected = 0;
		while (nextToABeeper()) {
			pickBeeper();
			beepersCollected++;
		}
		return beepersCollected;
		// return means it will have a value in the end, so you can plug it in your
		// program like how you plug in a interger variable, for example you can do int
		// MyVar1=pickAllBeepersAndCount();
	}

	public void/* note here its public void */ pickAllBeepers() {
		while (nextToABeeper()) {
			pickBeeper();
		}
		// public void means this function is not going to return a value, so you use it
		// like how you use roomba.move() or System.out.print()
		// this one is not used currently but when you are developing on production(when
		// you get a job), you will want to do so just in case you might need it in the
		// future
	}

}

public class Roomba implements Directions {

	private BetterBot /* Used to be Robot */ roomba = new BetterBot(7, 6, East, 67);

	// (because of the weakness and undevelopedness of the Robot module, )we are
	// changing roomba into our BetterBot
	public int cleanRoom(String worldName, int startX, int startY) {

		World.readWorld(worldName);
		World.setVisible(true);
		World.setDelay(1);
		int totalBeepers = 0;
		final int travelingPattern = 1;
		boolean finish = false;
		while (!finish) {// if we are not finished

			while (roomba.frontIsClear()) {

				totalBeepers = totalBeepers + roomba.pickAllBeepersAndCount();
				// remember how roomba.pickAllBeepersAndCount is defined? Its gonna return the
				// number of the beeper it have collected.

				// can also write in this way
				// totalBeepers += roomba.pickAllBeepersAndCount();

				roomba.move();
			}
			// if the program run till here it means front is not clear, else it should
			// still be looping in the while
			// in this case we can assume its running into a wall
			// we have 2 ways to do it now, we can either do zig zag or clear a line and go
			// back and go to the next line, like the ladder E.
			// the first way is relatively hard to write but require less work for the bot
			// the second way is realtively easier to write, but our roomba will have to do
			// extra work

			// first way
			if (travelingPattern == 1) {

				if (roomba.facingEast()) {
					roomba.turnLeft();
				} else {
					roomba.turnRight();
				}
				if (roomba.frontIsClear()) {
					roomba.move();
				} else {
					finish = true;
				}
				totalBeepers = totalBeepers + roomba.pickAllBeepersAndCount();
				if (roomba.facingEast()) {
					roomba.turnLeft();
				} else {
					roomba.turnRight();
				}
			} else if (travelingPattern == 2) {
				System.out.println("WIP");
			}
		}

		return totalBeepers;
	}

	public static void main(String[] args) {
		String worldName = "robot/basicRoom.wld";

		Roomba cleaner = new Roomba();
		int totalBeepers = cleaner.cleanRoom(worldName, 7, 6);
		System.out.println("Roomba cleaned up a total of " + totalBeepers + " beepers.");

	}

}